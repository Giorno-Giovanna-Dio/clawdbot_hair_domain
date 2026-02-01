#!/usr/bin/env bun
/**
 * Hair Lead Finder Demo
 *
 * Demonstrates the complete workflow with mock data.
 * Run with: bun run src/demo.ts
 */

import {
  LeadFinderWorkflow,
  createMockApifyClient,
  createMockBrowserControl,
  DMSender,
} from "./index.js";
import type { ProfileAnalysis, WorkflowState } from "./types.js";

// ANSI colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(color: keyof typeof colors, ...args: unknown[]): void {
  console.log(colors[color], ...args, colors.reset);
}

function printProgress(state: WorkflowState): void {
  const barLength = 30;
  const filled = Math.round((state.progress / 100) * barLength);
  const bar = "█".repeat(filled) + "░".repeat(barLength - filled);

  console.log(`\n${colors.cyan}[${bar}] ${state.progress.toFixed(0)}%${colors.reset}`);
  console.log(`${colors.dim}${state.statusMessage}${colors.reset}\n`);
}

function printProfileCard(analysis: ProfileAnalysis): void {
  const { profile, score, reasons, dmOptions } = analysis;

  console.log("\n" + "═".repeat(60));
  log("bright", `🎯 AI 推薦 | 分數: ${score}/10`);
  console.log("─".repeat(60));

  console.log(`${colors.cyan}@${profile.username}${colors.reset}`);
  console.log(`${profile.fullName}`);
  console.log(
    `👥 ${profile.followersCount.toLocaleString()} 追蹤者 | 📸 ${profile.postsCount} 貼文`
  );
  console.log(`💼 ${profile.businessCategoryName || "未設定類別"}`);

  console.log("\n" + colors.dim + "Bio:" + colors.reset);
  console.log(profile.biography || "(無 Bio)");

  console.log("\n" + colors.green + "📊 為什麼推薦：" + colors.reset);
  reasons.forEach((reason) => console.log(`  • ${reason}`));

  console.log("\n" + colors.magenta + "💬 生成的 DM 選項：" + colors.reset);
  dmOptions.forEach((dm, i) => {
    console.log(`\n  ${colors.yellow}[${i + 1}] ${dm.label}${colors.reset}`);
    console.log(`  ${colors.dim}${dm.rationale}${colors.reset}`);
    console.log("  ─".repeat(25));
    // Print first 100 chars of DM content
    const preview =
      dm.content.length > 100 ? dm.content.slice(0, 100) + "..." : dm.content;
    console.log(`  ${preview}`);
  });

  console.log("\n" + "═".repeat(60));
}

async function main(): Promise<void> {
  log("bright", "\n🔍 Hair Lead Finder Demo\n");
  log("dim", "這是一個展示如何使用 AI 尋找美容美髮業潛在客戶的 Demo\n");

  // Configuration
  const config = {
    hashtags: ["美髮沙龍", "台北美髮", "髮型設計", "染髮"],
    minFollowers: 1000,
    maxFollowers: 50000,
    maxProfiles: 10,
    serviceDescription:
      "我們提供美容美髮業專用的線上預約系統，可以自動化管理預約、提醒客戶、追蹤營收等功能。",
    companyName: "預約通 BookingPro",
  };

  log("cyan", "📋 搜尋設定:");
  console.log(`  Hashtags: ${config.hashtags.join(", ")}`);
  console.log(
    `  追蹤者範圍: ${config.minFollowers.toLocaleString()} - ${config.maxFollowers.toLocaleString()}`
  );
  console.log(`  最大搜尋數: ${config.maxProfiles}`);
  console.log(`  服務: ${config.companyName}`);
  console.log();

  // Create workflow
  const workflow = new LeadFinderWorkflow(
    config,
    {
      onStateChange: (state) => {
        printProgress(state);
      },
      onAnalysisComplete: (analyses) => {
        log("green", `\n✅ 分析完成！找到 ${analyses.length} 個推薦的潛在客戶\n`);

        // Print each recommended profile
        analyses.forEach((analysis) => {
          printProfileCard(analysis);
        });
      },
      onError: (error) => {
        console.error("\n❌ 錯誤:", error.message);
      },
    },
    {
      apifyClient: createMockApifyClient(),
    }
  );

  // Run the workflow
  log("blue", "🚀 開始執行...\n");

  try {
    const leads = await workflow.run();

    // Demo: Show how DM sending would work
    if (leads.length > 0) {
      log("magenta", "\n📤 DM 發送 Demo\n");
      log(
        "dim",
        "在實際使用中，選擇一個 DM 選項後會自動打開 Instagram 瀏覽器..."
      );

      const firstLead = leads[0];
      const selectedDM = firstLead.dmOptions[0];

      if (selectedDM) {
        log("yellow", `\n選擇的 DM (${selectedDM.label}):`);
        console.log("─".repeat(50));
        console.log(selectedDM.content);
        console.log("─".repeat(50));

        // Create a mock DM sender to demonstrate
        const mockBrowser = createMockBrowserControl();
        const sender = new DMSender(mockBrowser, {
          onStateChange: (state) => {
            log("dim", `  Browser: ${state.browserStatus}`);
          },
          onConfirmationRequired: async (state) => {
            log("yellow", "\n⏸️  等待使用者確認...");
            log("dim", "  (在實際 UI 中，這裡會顯示 Instagram 截圖)");
            // In real UI, this would be a user interaction
            return "confirm";
          },
          onComplete: (success, error) => {
            if (success) {
              log("green", "\n✅ DM 發送成功！");
            } else {
              log("yellow", `\n⚠️ DM 未發送: ${error}`);
            }
          },
        });

        log("blue", "\n模擬 DM 發送流程:");
        await sender.sendDM(firstLead.profile, selectedDM);
      }
    }

    log("bright", "\n🎉 Demo 完成！\n");
    log("dim", "在實際專案中，你需要:");
    console.log("  1. 設定 Apify API key 來真實抓取 Instagram 資料");
    console.log("  2. 設定 Anthropic API key 來使用 Claude 分析");
    console.log("  3. 建立 Web UI 來顯示推薦結果和發送 DM");
    console.log("  4. 使用 OpenClaw browser 來自動化 DM 發送");
    console.log();
  } catch (error) {
    console.error("Demo failed:", error);
    process.exit(1);
  }
}

main();
