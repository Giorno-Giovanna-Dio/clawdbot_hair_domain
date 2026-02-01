/**
 * Instagram Browser Crawler
 *
 * Uses OpenClaw browser automation to crawl Instagram profiles
 * and analyze them in real-time with LLM.
 */

import type {
  BrowserLeadFinderConfig,
  CrawlerEvents,
  CrawlerState,
  DiscoveredLead,
  ExtractedProfile,
} from "./types.js";
import { ProfileAnalyzer } from "./analyzer.js";

/** OpenClaw browser interface (matches the browser tool) */
export interface OpenClawBrowser {
  navigate(url: string): Promise<void>;
  snapshot(options?: { interactive?: boolean; maxChars?: number }): Promise<string>;
  click(ref: string): Promise<void>;
  type(ref: string, text: string): Promise<void>;
  scroll(options?: { direction?: "up" | "down"; amount?: number }): Promise<void>;
  wait(options: { timeMs?: number; text?: string }): Promise<void>;
  screenshot(): Promise<string>;
}

export class InstagramCrawler {
  private browser: OpenClawBrowser;
  private config: BrowserLeadFinderConfig;
  private events: CrawlerEvents;
  private analyzer: ProfileAnalyzer;
  private state: CrawlerState;
  private visitedProfiles: Set<string> = new Set();
  private discoveredLeads: DiscoveredLead[] = [];

  constructor(
    browser: OpenClawBrowser,
    config: BrowserLeadFinderConfig,
    events: CrawlerEvents
  ) {
    this.browser = browser;
    this.config = config;
    this.events = events;
    this.analyzer = new ProfileAnalyzer({
      apiKey: config.llmApiKey,
      model: config.llmModel,
      baseUrl: config.llmBaseUrl,
    });
    this.state = this.createInitialState();
  }

  /**
   * Start the crawling process
   */
  async start(): Promise<DiscoveredLead[]> {
    try {
      this.updateState({
        status: "starting",
        message: "正在啟動瀏覽器...",
      });

      // Navigate to Instagram
      await this.browser.navigate("https://www.instagram.com/");
      await this.browser.wait({ timeMs: 2000 });

      // Check if logged in
      const snapshot = await this.browser.snapshot({ maxChars: 5000 });
      if (snapshot.includes("Log in") || snapshot.includes("登入")) {
        throw new Error(
          "Instagram 未登入。請先在 OpenClaw browser profile 中登入 Instagram。"
        );
      }

      // Search each hashtag
      for (const hashtag of this.config.hashtags) {
        if (this.discoveredLeads.length >= this.config.maxProfiles) {
          break;
        }

        await this.searchHashtag(hashtag);
      }

      this.updateState({
        status: "completed",
        message: `完成！發現 ${this.discoveredLeads.length} 個潛在客戶`,
      });

      return this.discoveredLeads;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.updateState({
        status: "error",
        message: err.message,
        error: err.message,
      });
      this.events.onError(err);
      throw err;
    }
  }

  /**
   * Search a specific hashtag
   */
  private async searchHashtag(hashtag: string): Promise<void> {
    this.updateState({
      status: "searching",
      currentHashtag: hashtag,
      message: `正在搜尋 #${hashtag}...`,
    });

    // Navigate to hashtag page
    const hashtagUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(hashtag)}/`;
    await this.browser.navigate(hashtagUrl);
    await this.browser.wait({ timeMs: 2000 });

    // Get the page snapshot
    let snapshot = await this.browser.snapshot({ interactive: true, maxChars: 10000 });

    // Find post links in the grid
    const postRefs = this.extractPostRefs(snapshot);

    this.updateState({
      profilesFound: this.state.profilesFound + postRefs.length,
      message: `找到 ${postRefs.length} 個貼文，開始分析...`,
    });

    // Click on each post and analyze the profile
    for (const postRef of postRefs) {
      if (this.discoveredLeads.length >= this.config.maxProfiles) {
        break;
      }

      try {
        await this.analyzePostProfile(postRef, hashtag);
      } catch (error) {
        console.error("Error analyzing post:", error);
      }

      // Random delay to appear human-like
      const delay = this.config.actionDelayMs + Math.random() * 1000;
      await this.browser.wait({ timeMs: delay });
    }
  }

  /**
   * Click on a post and analyze the poster's profile
   */
  private async analyzePostProfile(postRef: string, hashtag: string): Promise<void> {
    // Click on the post
    await this.browser.click(postRef);
    await this.browser.wait({ timeMs: 1500 });

    // Get post snapshot to find username
    let snapshot = await this.browser.snapshot({ interactive: true, maxChars: 8000 });

    // Extract username from the post
    const username = this.extractUsernameFromPost(snapshot);
    if (!username || this.visitedProfiles.has(username)) {
      // Close the post modal and return
      await this.closeModal();
      return;
    }

    this.visitedProfiles.add(username);

    this.updateState({
      status: "browsing",
      currentProfile: username,
      message: `正在查看 @${username} 的個人頁面...`,
    });

    // Close the post modal first
    await this.closeModal();
    await this.browser.wait({ timeMs: 500 });

    // Navigate to profile
    await this.browser.navigate(`https://www.instagram.com/${username}/`);
    await this.browser.wait({ timeMs: 2000 });

    // Get profile snapshot
    snapshot = await this.browser.snapshot({ maxChars: 15000 });

    // Extract profile data
    const profile = this.extractProfileData(username, snapshot);

    // Check follower count filters
    if (
      profile.followersCount < this.config.minFollowers ||
      profile.followersCount > this.config.maxFollowers
    ) {
      this.events.onProfileSkipped(
        username,
        `追蹤者數量 (${profile.followersCount}) 不在範圍內`
      );
      this.updateState({
        profilesSkipped: this.state.profilesSkipped + 1,
      });
      return;
    }

    // Analyze with LLM
    this.updateState({
      status: "analyzing",
      message: `AI 正在分析 @${username}...`,
    });

    const analysis = await this.analyzer.analyzeProfile(profile, this.config);

    this.updateState({
      profilesAnalyzed: this.state.profilesAnalyzed + 1,
    });

    if (analysis.shouldSkip) {
      this.events.onProfileSkipped(username, analysis.skipReason || "不符合條件");
      this.updateState({
        profilesSkipped: this.state.profilesSkipped + 1,
      });
      return;
    }

    // Create lead
    const lead: DiscoveredLead = {
      id: `lead-${Date.now()}-${username}`,
      profile,
      analysis,
      discoveredAt: new Date().toISOString(),
      sourceHashtag: hashtag,
    };

    this.discoveredLeads.push(lead);

    this.updateState({
      leadsDiscovered: this.discoveredLeads.length,
      message: `發現潛在客戶: @${username} (分數: ${analysis.score}/10)`,
    });

    this.events.onLeadDiscovered(lead);
  }

  /**
   * Extract post refs from hashtag page snapshot
   */
  private extractPostRefs(snapshot: string): string[] {
    const refs: string[] = [];
    const lines = snapshot.split("\n");

    for (const line of lines) {
      // Look for image/link elements that are posts
      // Instagram posts typically have role=link or are images
      if (
        (line.includes("img") || line.includes("link")) &&
        (line.includes("[ref=") || line.includes("aria-ref"))
      ) {
        const refMatch = line.match(/\[ref=e?(\d+)\]|\[(\d+)\]|aria-ref="(\d+)"/);
        if (refMatch) {
          const num = refMatch[1] || refMatch[2] || refMatch[3];
          const ref = line.includes("[ref=e") ? `e${num}` : num;
          refs.push(ref);
        }
      }
    }

    // Take first 20 posts max
    return refs.slice(0, 20);
  }

  /**
   * Extract username from post modal
   */
  private extractUsernameFromPost(snapshot: string): string | null {
    // Look for username patterns in the snapshot
    // Instagram usernames are typically linked near the top of the post
    const usernameMatch = snapshot.match(
      /@([a-zA-Z0-9_.]{1,30})|link\s+"([a-zA-Z0-9_.]{1,30})"/
    );
    if (usernameMatch) {
      return usernameMatch[1] || usernameMatch[2];
    }

    // Alternative: look for profile link pattern
    const profileMatch = snapshot.match(
      /instagram\.com\/([a-zA-Z0-9_.]{1,30})\/?["\s]/
    );
    if (profileMatch) {
      return profileMatch[1];
    }

    return null;
  }

  /**
   * Extract profile data from profile page snapshot
   */
  private extractProfileData(
    username: string,
    snapshot: string
  ): ExtractedProfile {
    // Parse follower/following/posts counts
    const followersMatch = snapshot.match(
      /(\d+(?:,\d+)*(?:\.\d+)?[KMkm]?)\s*(?:followers|追蹤者|位追蹤者)/i
    );
    const followingMatch = snapshot.match(
      /(\d+(?:,\d+)*(?:\.\d+)?[KMkm]?)\s*(?:following|追蹤中)/i
    );
    const postsMatch = snapshot.match(
      /(\d+(?:,\d+)*)\s*(?:posts|貼文)/i
    );

    // Parse bio (usually appears after the name)
    const bioMatch = snapshot.match(
      /(?:biography|bio|個人簡介)[:\s]*([^\n]{10,300})/i
    );

    // Check for business account indicators
    const isBusinessAccount =
      snapshot.includes("Professional dashboard") ||
      snapshot.includes("專業儀表板") ||
      snapshot.includes("Contact") ||
      snapshot.includes("聯絡");

    // Extract external URL
    const urlMatch = snapshot.match(
      /(?:link|連結)[:\s]*(https?:\/\/[^\s\]"]+)/i
    );

    // Extract recent post captions (look for text after post indicators)
    const captionMatches = snapshot.matchAll(
      /(?:caption|說明|貼文)[:\s]*([^\n]{20,200})/gi
    );
    const recentPostCaptions = Array.from(captionMatches)
      .slice(0, 3)
      .map((m) => m[1]);

    return {
      username,
      fullName: this.extractFullName(snapshot) || username,
      biography: bioMatch?.[1]?.trim() || this.extractBioFromSnapshot(snapshot),
      followersCount: this.parseCount(followersMatch?.[1] || "0"),
      followsCount: this.parseCount(followingMatch?.[1] || "0"),
      postsCount: this.parseCount(postsMatch?.[1] || "0"),
      isBusinessAccount,
      businessCategory: this.extractBusinessCategory(snapshot),
      externalUrl: urlMatch?.[1],
      profileUrl: `https://www.instagram.com/${username}/`,
      recentPostCaptions,
      rawSnapshot: snapshot,
    };
  }

  /**
   * Extract full name from snapshot
   */
  private extractFullName(snapshot: string): string | null {
    // Look for name patterns
    const nameMatch = snapshot.match(/heading[:\s]+"([^"]+)"/i);
    return nameMatch?.[1] || null;
  }

  /**
   * Extract bio text from snapshot (fallback method)
   */
  private extractBioFromSnapshot(snapshot: string): string {
    // Look for text blocks that look like bios
    const lines = snapshot.split("\n");
    for (const line of lines) {
      // Bios often contain emojis, line breaks, or specific keywords
      if (
        line.length > 30 &&
        line.length < 500 &&
        (line.includes("📍") ||
          line.includes("💇") ||
          line.includes("✨") ||
          line.includes("預約") ||
          line.includes("Line") ||
          line.includes("salon") ||
          line.includes("hair"))
      ) {
        return line.trim();
      }
    }
    return "";
  }

  /**
   * Extract business category
   */
  private extractBusinessCategory(snapshot: string): string | undefined {
    const categoryMatch = snapshot.match(
      /(?:category|類別)[:\s]*([^\n]{5,50})/i
    );
    return categoryMatch?.[1]?.trim();
  }

  /**
   * Parse follower count string to number
   */
  private parseCount(countStr: string): number {
    const cleaned = countStr.replace(/,/g, "").trim();
    const multiplierMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*([KMkm])?/);
    if (!multiplierMatch) return 0;

    let num = parseFloat(multiplierMatch[1]);
    const multiplier = multiplierMatch[2]?.toUpperCase();

    if (multiplier === "K") num *= 1000;
    if (multiplier === "M") num *= 1000000;

    return Math.round(num);
  }

  /**
   * Close modal (post view)
   */
  private async closeModal(): Promise<void> {
    try {
      // Try pressing Escape
      // Or find and click close button
      const snapshot = await this.browser.snapshot({ interactive: true });
      const closeMatch = snapshot.match(
        /\[ref=e?(\d+)\].*(?:Close|關閉|×|✕)/i
      );
      if (closeMatch) {
        const ref = snapshot.includes("[ref=e") ? `e${closeMatch[1]}` : closeMatch[1];
        await this.browser.click(ref);
      }
    } catch {
      // If closing fails, navigate back
      await this.browser.navigate("javascript:history.back()");
    }
  }

  /**
   * Create initial state
   */
  private createInitialState(): CrawlerState {
    return {
      status: "idle",
      profilesFound: 0,
      profilesAnalyzed: 0,
      leadsDiscovered: 0,
      profilesSkipped: 0,
      message: "準備就緒",
    };
  }

  /**
   * Update state and notify
   */
  private updateState(partial: Partial<CrawlerState>): void {
    this.state = { ...this.state, ...partial };
    this.events.onStateChange(this.state);
  }

  /**
   * Get current state
   */
  getState(): CrawlerState {
    return { ...this.state };
  }

  /**
   * Get discovered leads
   */
  getLeads(): DiscoveredLead[] {
    return [...this.discoveredLeads];
  }
}
