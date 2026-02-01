/**
 * Lead Finder Workflow - Orchestrates the complete lead generation process
 *
 * Flow:
 * 1. Scrape profiles from Instagram (via Apify API)
 * 2. Analyze profiles with LLM
 * 3. Present recommendations to user
 * 4. Send DMs with user confirmation
 */

import { ProfileAnalyzer } from "./analyzer.js";
import { DMSender, type DMSenderEvents } from "./dm-sender.js";
import type {
  DMOption,
  LeadFinderConfig,
  ProfileAnalysis,
  ScrapedProfile,
  WorkflowState,
} from "./types.js";

/** Events for workflow progress tracking */
export interface WorkflowEvents {
  onStateChange: (state: WorkflowState) => void;
  onAnalysisComplete: (analyses: ProfileAnalysis[]) => void;
  onError: (error: Error) => void;
}

/** Apify client interface for scraping */
interface ApifyClient {
  runActor(
    actorId: string,
    input: Record<string, unknown>
  ): Promise<{ datasetId: string }>;
  getDatasetItems<T>(datasetId: string): Promise<T[]>;
}

export class LeadFinderWorkflow {
  private config: LeadFinderConfig;
  private analyzer: ProfileAnalyzer;
  private events: WorkflowEvents;
  private apifyClient: ApifyClient;
  private state: WorkflowState;

  constructor(
    config: LeadFinderConfig,
    events: WorkflowEvents,
    options: {
      apifyClient: ApifyClient;
      anthropicApiKey?: string;
    }
  ) {
    this.config = config;
    this.events = events;
    this.apifyClient = options.apifyClient;
    this.analyzer = new ProfileAnalyzer({
      anthropicApiKey: options.anthropicApiKey,
    });

    this.state = this.createInitialState();
  }

  /**
   * Run the complete workflow
   */
  async run(): Promise<ProfileAnalysis[]> {
    try {
      // Step 1: Scrape profiles
      this.updateState({
        step: "scraping",
        statusMessage: "正在從 Instagram 搜尋美容美髮相關帳號...",
        progress: 0,
      });

      const profiles = await this.scrapeProfiles();

      this.updateState({
        totalProfiles: profiles.length,
        progress: 20,
        statusMessage: `找到 ${profiles.length} 個帳號，開始 AI 分析...`,
      });

      // Step 2: Analyze profiles with LLM
      this.updateState({ step: "analyzing" });

      const analyses = await this.analyzer.analyzeProfiles(
        profiles,
        this.config,
        (current, total) => {
          const progress = 20 + (current / total) * 60;
          this.updateState({
            processedProfiles: current,
            progress,
            statusMessage: `AI 分析中... (${current}/${total})`,
          });
        }
      );

      // Sort by score (highest first)
      const sortedAnalyses = analyses.sort((a, b) => b.score - a.score);

      // Filter only recommended profiles (score >= 6)
      const recommended = sortedAnalyses.filter((a) => a.score >= 6);

      this.updateState({
        step: "ready_for_review",
        progress: 100,
        analyzedProfiles: recommended,
        statusMessage: `分析完成！找到 ${recommended.length} 個推薦的潛在客戶`,
      });

      this.events.onAnalysisComplete(recommended);
      return recommended;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.updateState({
        step: "idle",
        statusMessage: `錯誤: ${err.message}`,
      });
      this.events.onError(err);
      throw err;
    }
  }

  /**
   * Scrape profiles from Instagram using Apify
   */
  private async scrapeProfiles(): Promise<ScrapedProfile[]> {
    // Build hashtag search queries
    const hashtags = this.config.hashtags.map((h) =>
      h.startsWith("#") ? h : `#${h}`
    );

    // Run Apify Instagram Scraper
    const { datasetId } = await this.apifyClient.runActor(
      "apify/instagram-scraper",
      {
        search: hashtags.join(" "),
        searchType: "hashtag",
        resultsType: "posts",
        resultsLimit: this.config.maxProfiles * 3, // Get more to filter
      }
    );

    // Get results
    const posts = await this.apifyClient.getDatasetItems<{
      ownerUsername: string;
      ownerId: string;
    }>(datasetId);

    // Extract unique usernames
    const uniqueUsernames = [...new Set(posts.map((p) => p.ownerUsername))];

    // Scrape profile details for each unique user
    const { datasetId: profileDatasetId } = await this.apifyClient.runActor(
      "apify/instagram-profile-scraper",
      {
        usernames: uniqueUsernames.slice(0, this.config.maxProfiles),
      }
    );

    const profiles =
      await this.apifyClient.getDatasetItems<ScrapedProfile>(profileDatasetId);

    // Filter by follower count and other criteria
    return profiles.filter((p) => {
      if (p.private) return false;
      if (p.followersCount < this.config.minFollowers) return false;
      if (p.followersCount > this.config.maxFollowers) return false;

      // Check business category if specified
      if (this.config.businessCategories?.length) {
        const category = p.businessCategoryName?.toLowerCase() || "";
        const matches = this.config.businessCategories.some((c) =>
          category.includes(c.toLowerCase())
        );
        if (!matches && !p.isBusinessAccount) return false;
      }

      return true;
    });
  }

  /**
   * Create initial workflow state
   */
  private createInitialState(): WorkflowState {
    return {
      step: "idle",
      progress: 0,
      statusMessage: "準備就緒",
      totalProfiles: 0,
      processedProfiles: 0,
      analyzedProfiles: [],
      sentDMs: [],
      errors: [],
    };
  }

  /**
   * Update state and notify listeners
   */
  private updateState(partial: Partial<WorkflowState>): void {
    this.state = { ...this.state, ...partial };
    this.events.onStateChange(this.state);
  }

  /**
   * Get current state
   */
  getState(): WorkflowState {
    return { ...this.state };
  }

  /**
   * Record a sent DM
   */
  recordSentDM(
    profileId: string,
    dmOptionId: string,
    success: boolean
  ): void {
    this.updateState({
      sentDMs: [
        ...this.state.sentDMs,
        {
          profileId,
          dmOptionId,
          sentAt: new Date().toISOString(),
          success,
        },
      ],
    });
  }
}

/**
 * Create a mock Apify client for testing
 */
export function createMockApifyClient(): ApifyClient {
  return {
    async runActor(actorId: string, input: Record<string, unknown>) {
      console.log(`[Mock Apify] Running actor: ${actorId}`, input);
      return { datasetId: "mock-dataset-123" };
    },
    async getDatasetItems<T>(datasetId: string): Promise<T[]> {
      console.log(`[Mock Apify] Getting dataset: ${datasetId}`);
      // Return mock data
      return [
        {
          id: "123456789",
          username: "beautysalon_taipei",
          fullName: "小美髮廊",
          biography:
            "✨ 專業美髮沙龍 | 創辦人 Amy\n📍 台北市大安區\n📞 預約專線: 02-1234-5678\n💇‍♀️ 染燙護專業服務",
          followersCount: 5234,
          followsCount: 423,
          postsCount: 892,
          isBusinessAccount: true,
          businessCategoryName: "美髮沙龍",
          externalUrl: "https://beautysalon.com.tw",
          profilePicUrl: "https://example.com/pic.jpg",
          verified: false,
          private: false,
          latestPosts: [
            {
              id: "post1",
              type: "Image",
              caption:
                "新的漸層染髮作品 💜💙 預約請私訊或電話聯繫！#美髮 #染髮 #台北美髮",
              likesCount: 234,
              commentsCount: 12,
              timestamp: "2024-01-15T10:00:00.000Z",
            },
            {
              id: "post2",
              type: "Image",
              caption: "本週預約已滿！感謝大家支持 ❤️ 下週還有少量名額",
              likesCount: 189,
              commentsCount: 8,
              timestamp: "2024-01-14T14:00:00.000Z",
            },
          ],
        },
        {
          id: "987654321",
          username: "hairmaster_ks",
          fullName: "高雄髮型設計師 小王",
          biography:
            "🎨 髮型設計師 10年經驗\n💈 Hair Master 店長\n🏆 2023美髮大賽冠軍\nLine: hairmaster888",
          followersCount: 8900,
          followsCount: 567,
          postsCount: 1234,
          isBusinessAccount: true,
          businessCategoryName: "個人部落格",
          externalUrl: null,
          profilePicUrl: "https://example.com/pic2.jpg",
          verified: false,
          private: false,
          latestPosts: [
            {
              id: "post3",
              type: "Video",
              caption: "來看看這個超酷的漸層染髮過程！#美髮教學 #染髮技巧",
              likesCount: 567,
              commentsCount: 45,
              timestamp: "2024-01-16T09:00:00.000Z",
            },
          ],
        },
      ] as T[];
    },
  };
}
