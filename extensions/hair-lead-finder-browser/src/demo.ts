#!/usr/bin/env bun
/**
 * Hair Lead Finder (Browser Version) - Demo
 *
 * This demo shows how to use the browser-based lead finder.
 * It uses a mock browser for demonstration purposes.
 *
 * To run with real OpenClaw browser:
 * 1. Ensure OpenClaw gateway is running
 * 2. Login to Instagram in the OpenClaw browser profile
 * 3. Run this script with a real browser instance
 */

import { InstagramCrawler, type OpenClawBrowser } from "./index.js";

// ANSI colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

function log(color: keyof typeof colors, ...args: unknown[]): void {
  console.log(colors[color], ...args, colors.reset);
}

/**
 * Create a mock browser for demo purposes
 */
function createMockBrowser(): OpenClawBrowser {
  let currentUrl = "";
  let navigationCount = 0;

  // Mock profile data
  const mockProfiles: Record<string, string> = {
    beautysalon_taipei: `
      heading: "小美髮廊 BeautySalon"
      biography: "✨ 專業美髮沙龍 | 創辦人 Amy
      📍 台北市大安區
      📞 預約專線: 02-2711-5678
      💇‍♀️ 染燙護專業服務
      Line: beautysalon_tw"
      12,345 followers · 423 following · 892 posts
      category: 美髮沙龍
      Professional dashboard available
      link: https://beautysalon.com.tw
    `,
    hairmaster_kaohsiung: `
      heading: "高雄髮型設計師 小王"
      biography: "🎨 髮型設計師 10年經驗
      💈 Hair Master 店長
      🏆 2023美髮大賽冠軍
      Line: hairmaster888"
      8,900 followers · 567 following · 1,234 posts
      category: 個人部落格
      Professional dashboard available
    `,
    random_user: `
      heading: "Random User"
      biography: "Just a random person 🌈"
      234 followers · 567 following · 45 posts
    `,
  };

  const profileUsernames = Object.keys(mockProfiles);
  let profileIndex = 0;

  return {
    async navigate(url: string) {
      currentUrl = url;
      log("dim", `  [Browser] Navigating to: ${url}`);
    },

    async snapshot(options) {
      log("dim", `  [Browser] Taking snapshot...`);

      // Return different content based on current URL
      if (currentUrl.includes("/explore/tags/")) {
        // Hashtag page - return mock posts
        return `
          [ref=e1] img "Post 1"
          [ref=e2] img "Post 2"
          [ref=e3] img "Post 3"
        `;
      }

      if (currentUrl.includes("instagram.com/") && !currentUrl.includes("/explore/")) {
        // Profile page
        const username = currentUrl.match(/instagram\.com\/([^/]+)/)?.[1];
        if (username && mockProfiles[username]) {
          return mockProfiles[username];
        }
        // Return a random profile
        const randomProfile = profileUsernames[profileIndex % profileUsernames.length];
        profileIndex++;
        return mockProfiles[randomProfile] || mockProfiles.random_user;
      }

      // Default - home page (logged in)
      return `
        heading: "Instagram"
        Home Feed
        Search
        Create
        Profile
      `;
    },

    async click(ref: string) {
      log("dim", `  [Browser] Clicking ref: ${ref}`);
      navigationCount++;
      // Simulate navigating to a profile after clicking a post
      const username = profileUsernames[navigationCount % profileUsernames.length];
      currentUrl = `https://www.instagram.com/${username}/`;
    },

    async type(ref: string, text: string) {
      log("dim", `  [Browser] Typing: ${text}`);
    },

    async scroll(options) {
      log("dim", `  [Browser] Scrolling ${options?.direction || "down"}`);
    },

    async wait(options) {
      const ms = options.timeMs || 1000;
      log("dim", `  [Browser] Waiting ${ms}ms...`);
      await new Promise((resolve) => setTimeout(resolve, Math.min(ms, 500))); // Speed up for demo
    },

    async screenshot() {
      log("dim", `  [Browser] Taking screenshot`);
      return "base64-mock-screenshot";
    },
  };
}

async function main() {
  log("bright", "\n🌐 Hair Lead Finder (Browser Version) - Demo\n");
  log("dim", "這個版本直接使用 OpenClaw 瀏覽器爬取 Instagram，不需要外部 Scraper\n");

  // Check for API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    log("yellow", "⚠️  未設定 OPENAI_API_KEY，使用 mock 分析\n");
  }

  // Create mock browser
  const browser = createMockBrowser();

  // Configuration
  const config = {
    hashtags: ["美髮沙龍", "台北美髮"],
    maxProfiles: 3, // Small number for demo
    minFollowers: 100,
    maxFollowers: 100000,
    actionDelayMs: 500, // Fast for demo
    companyName: "預約通 BookingPro",
    serviceDescription: "我們提供美容美髮業專用的線上預約系統",
    llmApiKey: apiKey || "mock-key",
    llmModel: "gpt-4o-mini",
  };

  log("cyan", "📋 設定:");
  console.log(`   Hashtags: ${config.hashtags.join(", ")}`);
  console.log(`   最大搜尋: ${config.maxProfiles} 個`);
  console.log(`   LLM: ${config.llmModel}`);
  console.log();

  // Create crawler
  const crawler = new InstagramCrawler(browser, config, {
    onStateChange: (state) => {
      const statusIcon: Record<string, string> = {
        idle: "⏸️",
        starting: "🚀",
        searching: "🔍",
        browsing: "🌐",
        analyzing: "🤖",
        waiting: "⏳",
        completed: "✅",
        error: "❌",
      };
      const icon = statusIcon[state.status] || "•";
      log("blue", `${icon} ${state.message}`);

      if (state.profilesAnalyzed > 0) {
        console.log(
          colors.dim +
            `   [已分析: ${state.profilesAnalyzed} | 發現: ${state.leadsDiscovered} | 跳過: ${state.profilesSkipped}]` +
            colors.reset
        );
      }
    },

    onLeadDiscovered: (lead) => {
      console.log();
      log("green", `🎯 發現潛在客戶!`);
      console.log(`   @${lead.profile.username}`);
      console.log(`   ${lead.profile.fullName}`);
      console.log(`   追蹤者: ${lead.profile.followersCount.toLocaleString()}`);
      console.log(`   分數: ${lead.analysis.score}/10`);
      console.log(`   來源: #${lead.sourceHashtag}`);

      if (lead.analysis.reasons.length > 0) {
        console.log(`   原因:`);
        lead.analysis.reasons.slice(0, 3).forEach((r) => {
          console.log(`     • ${r}`);
        });
      }
      console.log();
    },

    onProfileSkipped: (username, reason) => {
      log("dim", `   ⏭️  跳過 @${username}: ${reason}`);
    },

    onError: (error) => {
      log("red", `❌ 錯誤: ${error.message}`);
    },
  });

  // Run crawler
  log("bright", "🚀 開始爬取...\n");

  try {
    const leads = await crawler.start();

    console.log();
    log("bright", "═".repeat(50));
    log("green", `✅ 完成! 發現 ${leads.length} 個潛在客戶`);
    log("bright", "═".repeat(50));

    if (leads.length > 0) {
      console.log();
      log("cyan", "📋 潛在客戶列表:");
      leads.forEach((lead, i) => {
        console.log(`\n${i + 1}. @${lead.profile.username}`);
        console.log(`   ${lead.profile.fullName}`);
        console.log(`   分數: ${lead.analysis.score}/10`);
        console.log(`   Bio: ${lead.profile.biography.slice(0, 100)}...`);
      });
    }

    console.log();
    log("dim", "在實際使用中，你需要:");
    console.log("  1. 設定 OPENAI_API_KEY 環境變數");
    console.log("  2. 使用真正的 OpenClaw browser (已登入 Instagram)");
    console.log("  3. 連接到 Web Dashboard 顯示結果");
    console.log();
  } catch (error) {
    console.error("Demo failed:", error);
  }
}

main();
