/**
 * Profile Analyzer - LLM-powered analysis of Instagram profiles
 *
 * Uses Claude to analyze scraped profiles and generate personalized DM options.
 */

import Anthropic from "@anthropic-ai/sdk";

import type {
  DMOption,
  LeadFinderConfig,
  ProfileAnalysis,
  ScrapedProfile,
} from "./types.js";

const ANALYSIS_PROMPT = `你是一個專業的 B2B 銷售分析師，專門協助找出美容美髮產業的潛在客戶。

分析以下 Instagram 帳號，判斷這個帳號是否為美容美髮沙龍的店長或經營者（而非員工或網紅）。

## 帳號資訊
- 用戶名：{{username}}
- 顯示名稱：{{fullName}}
- Bio：{{biography}}
- 追蹤者：{{followersCount}}
- 貼文數：{{postsCount}}
- 是否商業帳號：{{isBusinessAccount}}
- 商業類別：{{businessCategoryName}}
- 外部連結：{{externalUrl}}
- 近期貼文：
{{recentPosts}}

## 我們的服務
{{serviceDescription}}

## 分析要求
請分析並回傳 JSON 格式：

{
  "isLikelyOwner": boolean,        // 是否為店長/經營者
  "ownerConfidence": "high" | "medium" | "low",
  "score": number,                  // 推薦分數 0-10
  "reasons": string[],              // 推薦原因（3-5 點）
  "contactMethods": {
    "hasEmail": boolean,
    "hasPhone": boolean,
    "hasLine": boolean,
    "hasWebsite": boolean,
    "extracted": string[]           // 提取到的聯絡方式
  },
  "businessSignals": {
    "hasBookingMentions": boolean,  // 是否提到預約
    "hasLocationMentions": boolean, // 是否提到地址
    "mentionsServices": string[],   // 提到的服務項目
    "averageEngagement": number     // 估計互動率
  },
  "dmOptions": [
    {
      "style": "professional",
      "label": "專業商務風格",
      "content": "完整的 DM 內容...",
      "rationale": "為什麼選擇這個風格"
    },
    {
      "style": "friendly",
      "label": "親切對話風格",
      "content": "完整的 DM 內容...",
      "rationale": "..."
    },
    {
      "style": "value-focused",
      "label": "價值導向風格",
      "content": "完整的 DM 內容...",
      "rationale": "..."
    }
  ]
}

注意：
1. DM 內容要個人化，引用帳號的特色或近期貼文
2. DM 長度適中（100-200字），不要太長
3. 語氣要自然，像真人寫的
4. 提供清楚的行動呼籲（CTA）
5. 只回傳 JSON，不要其他文字`;

interface AnalyzerOptions {
  anthropicApiKey?: string;
  model?: string;
}

export class ProfileAnalyzer {
  private client: Anthropic;
  private model: string;

  constructor(options: AnalyzerOptions = {}) {
    this.client = new Anthropic({
      apiKey: options.anthropicApiKey || process.env.ANTHROPIC_API_KEY,
    });
    this.model = options.model || "claude-sonnet-4-20250514";
  }

  /**
   * Analyze a single profile and generate DM options
   */
  async analyzeProfile(
    profile: ScrapedProfile,
    config: LeadFinderConfig
  ): Promise<ProfileAnalysis> {
    // Format recent posts for the prompt
    const recentPosts =
      profile.latestPosts
        ?.slice(0, 5)
        .map(
          (p) =>
            `- [${p.type}] ${p.caption?.slice(0, 200) || "(無說明)"} (❤️ ${p.likesCount})`
        )
        .join("\n") || "(無近期貼文資料)";

    // Build the prompt
    const prompt = ANALYSIS_PROMPT.replace("{{username}}", profile.username)
      .replace("{{fullName}}", profile.fullName || "")
      .replace("{{biography}}", profile.biography || "")
      .replace("{{followersCount}}", String(profile.followersCount))
      .replace("{{postsCount}}", String(profile.postsCount))
      .replace("{{isBusinessAccount}}", profile.isBusinessAccount ? "是" : "否")
      .replace("{{businessCategoryName}}", profile.businessCategoryName || "未設定")
      .replace("{{externalUrl}}", profile.externalUrl || "無")
      .replace("{{recentPosts}}", recentPosts)
      .replace(
        "{{serviceDescription}}",
        `${config.companyName}: ${config.serviceDescription}`
      );

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    // Extract JSON from response
    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Try to parse JSON from the response
    let analysisData: Omit<ProfileAnalysis, "id" | "profile" | "analyzedAt">;
    try {
      // Find JSON in the response (might be wrapped in markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      analysisData = JSON.parse(jsonMatch[0]);
    } catch (error) {
      // Fallback if parsing fails
      console.error("Failed to parse LLM response:", error);
      analysisData = this.createFallbackAnalysis(profile);
    }

    // Add IDs to DM options
    const dmOptions: DMOption[] = (analysisData.dmOptions || []).map(
      (dm, index) => ({
        ...dm,
        id: `dm-${profile.id}-${index}`,
      })
    );

    return {
      id: `analysis-${profile.id}`,
      profile,
      score: analysisData.score,
      isLikelyOwner: analysisData.isLikelyOwner,
      ownerConfidence: analysisData.ownerConfidence,
      reasons: analysisData.reasons,
      contactMethods: analysisData.contactMethods,
      businessSignals: analysisData.businessSignals,
      dmOptions,
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Analyze multiple profiles in batch
   */
  async analyzeProfiles(
    profiles: ScrapedProfile[],
    config: LeadFinderConfig,
    onProgress?: (current: number, total: number) => void
  ): Promise<ProfileAnalysis[]> {
    const results: ProfileAnalysis[] = [];

    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      try {
        const analysis = await this.analyzeProfile(profile, config);
        results.push(analysis);
      } catch (error) {
        console.error(`Failed to analyze profile ${profile.username}:`, error);
        // Create a minimal analysis for failed profiles
        results.push({
          id: `analysis-${profile.id}`,
          profile,
          score: 0,
          isLikelyOwner: false,
          ownerConfidence: "low",
          reasons: ["分析失敗"],
          contactMethods: {
            hasEmail: false,
            hasPhone: false,
            hasLine: false,
            hasWebsite: false,
            extracted: [],
          },
          businessSignals: {
            hasBookingMentions: false,
            hasLocationMentions: false,
            mentionsServices: [],
            averageEngagement: 0,
          },
          dmOptions: [],
          analyzedAt: new Date().toISOString(),
        });
      }

      onProgress?.(i + 1, profiles.length);

      // Rate limiting - wait between requests
      if (i < profiles.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  /**
   * Create a fallback analysis when LLM parsing fails
   */
  private createFallbackAnalysis(
    profile: ScrapedProfile
  ): Omit<ProfileAnalysis, "id" | "profile" | "analyzedAt"> {
    // Basic heuristics for fallback
    const bio = profile.biography?.toLowerCase() || "";
    const isLikelyOwner =
      bio.includes("店長") ||
      bio.includes("創辦") ||
      bio.includes("owner") ||
      bio.includes("salon");

    return {
      score: isLikelyOwner ? 5 : 2,
      isLikelyOwner,
      ownerConfidence: "low",
      reasons: ["需要人工審核"],
      contactMethods: {
        hasEmail: bio.includes("@") && bio.includes("."),
        hasPhone: /\d{4}[-\s]?\d{4}/.test(bio),
        hasLine: bio.includes("line"),
        hasWebsite: !!profile.externalUrl,
        extracted: [],
      },
      businessSignals: {
        hasBookingMentions: bio.includes("預約") || bio.includes("book"),
        hasLocationMentions: false,
        mentionsServices: [],
        averageEngagement: 0,
      },
      dmOptions: [],
    };
  }
}
