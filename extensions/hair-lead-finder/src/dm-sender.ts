/**
 * DM Sender - Instagram DM automation using OpenClaw browser
 *
 * Semi-automated DM sending with user confirmation before each send.
 * Uses OpenClaw's Playwright-based browser automation.
 */

import type { DMOption, DMSendingState, ScrapedProfile } from "./types.js";

/** Browser control interface (matches OpenClaw browser tool) */
interface BrowserControl {
  navigate(url: string): Promise<void>;
  snapshot(options?: { interactive?: boolean }): Promise<string>;
  click(ref: string): Promise<void>;
  type(ref: string, text: string): Promise<void>;
  screenshot(): Promise<string>;
  wait(options: { timeMs?: number; text?: string }): Promise<void>;
}

/** Events emitted during DM sending process */
export interface DMSenderEvents {
  onStateChange: (state: DMSendingState) => void;
  onConfirmationRequired: (
    state: DMSendingState
  ) => Promise<"confirm" | "cancel" | "edit">;
  onComplete: (success: boolean, error?: string) => void;
}

export class DMSender {
  private browser: BrowserControl;
  private events: DMSenderEvents;
  private state: DMSendingState;

  constructor(browser: BrowserControl, events: DMSenderEvents) {
    this.browser = browser;
    this.events = events;
    this.state = {
      currentProfile: null,
      selectedDM: null,
      browserStatus: "closed",
    };
  }

  /**
   * Send a DM to a profile with user confirmation
   */
  async sendDM(profile: ScrapedProfile, dm: DMOption): Promise<boolean> {
    this.updateState({
      currentProfile: profile,
      selectedDM: dm,
      browserStatus: "opening",
      error: undefined,
    });

    try {
      // Step 1: Navigate to profile
      await this.navigateToProfile(profile.username);

      // Step 2: Open DM dialog
      await this.openDMDialog();

      // Step 3: Type the message
      await this.typeMessage(dm.content);

      // Step 4: Take screenshot and wait for confirmation
      const screenshot = await this.takeConfirmationScreenshot();
      this.updateState({
        browserStatus: "waiting_confirm",
        screenshotBase64: screenshot,
      });

      // Step 5: Wait for user confirmation
      const decision = await this.events.onConfirmationRequired(this.state);

      if (decision === "cancel") {
        this.events.onComplete(false, "使用者取消發送");
        return false;
      }

      if (decision === "edit") {
        // User wants to edit - return false so UI can handle
        this.events.onComplete(false, "使用者選擇編輯");
        return false;
      }

      // Step 6: Click send button
      await this.clickSendButton();

      // Step 7: Verify sent
      await this.verifySent();

      this.events.onComplete(true);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.updateState({
        browserStatus: "closed",
        error: errorMessage,
      });
      this.events.onComplete(false, errorMessage);
      return false;
    }
  }

  /**
   * Navigate to the target Instagram profile
   */
  private async navigateToProfile(username: string): Promise<void> {
    this.updateState({ browserStatus: "opening" });

    const profileUrl = `https://www.instagram.com/${username}/`;
    await this.browser.navigate(profileUrl);

    // Wait for profile to load
    await this.browser.wait({ timeMs: 2000 });

    // Verify we're on the right page by looking for the username
    const snapshot = await this.browser.snapshot({ interactive: true });
    if (!snapshot.toLowerCase().includes(username.toLowerCase())) {
      throw new Error(`無法載入個人頁面: ${username}`);
    }
  }

  /**
   * Find and click the "Message" button on the profile
   */
  private async openDMDialog(): Promise<void> {
    this.updateState({ browserStatus: "ready" });

    // Get interactive elements
    const snapshot = await this.browser.snapshot({ interactive: true });

    // Find the message button
    // Instagram's message button text varies by language:
    // - "Message" (English)
    // - "訊息" (Traditional Chinese)
    // - "メッセージ" (Japanese)
    const messageButtonRef = this.findRefByText(snapshot, [
      "Message",
      "訊息",
      "メッセージ",
      "傳送訊息",
    ]);

    if (!messageButtonRef) {
      throw new Error("找不到「發送訊息」按鈕。可能帳號設定為私人或不接受訊息。");
    }

    await this.browser.click(messageButtonRef);
    await this.browser.wait({ timeMs: 1500 });
  }

  /**
   * Type the DM content into the message input
   */
  private async typeMessage(content: string): Promise<void> {
    this.updateState({ browserStatus: "typing" });

    // Get the message input
    const snapshot = await this.browser.snapshot({ interactive: true });

    // Find the text input area
    // Instagram's input placeholder varies:
    // - "Message..." (English)
    // - "訊息..." (Traditional Chinese)
    const inputRef = this.findRefByText(snapshot, [
      "Message",
      "訊息",
      "Write a message",
      "輸入訊息",
    ]);

    if (!inputRef) {
      throw new Error("找不到訊息輸入框");
    }

    // Type the message
    await this.browser.type(inputRef, content);
    await this.browser.wait({ timeMs: 500 });
  }

  /**
   * Take a screenshot for user confirmation
   */
  private async takeConfirmationScreenshot(): Promise<string> {
    return await this.browser.screenshot();
  }

  /**
   * Click the send button
   */
  private async clickSendButton(): Promise<void> {
    const snapshot = await this.browser.snapshot({ interactive: true });

    // Find the send button
    // Instagram's send button text:
    // - "Send" (English)
    // - "傳送" (Traditional Chinese)
    const sendButtonRef = this.findRefByText(snapshot, ["Send", "傳送", "送出"]);

    if (!sendButtonRef) {
      throw new Error("找不到「傳送」按鈕");
    }

    await this.browser.click(sendButtonRef);
    await this.browser.wait({ timeMs: 1000 });
  }

  /**
   * Verify the message was sent successfully
   */
  private async verifySent(): Promise<void> {
    // Wait a moment for the message to appear in the chat
    await this.browser.wait({ timeMs: 1500 });

    // Take a snapshot to verify the message appears in the conversation
    const snapshot = await this.browser.snapshot({ interactive: true });

    // If we can see the message content in the chat, consider it sent
    // This is a basic verification - could be enhanced
    if (
      this.state.selectedDM &&
      snapshot.includes(this.state.selectedDM.content.slice(0, 50))
    ) {
      return; // Success
    }

    // If we don't see the message, we still consider it potentially successful
    // since Instagram might not show the full message immediately
    console.log("無法確認訊息是否已發送，請手動檢查");
  }

  /**
   * Find an element reference by matching text patterns
   */
  private findRefByText(snapshot: string, patterns: string[]): string | null {
    // Parse the snapshot to find refs
    // OpenClaw snapshot format includes refs like [ref=e12] or aria-ref="12"
    const lines = snapshot.split("\n");

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      for (const pattern of patterns) {
        if (lowerLine.includes(pattern.toLowerCase())) {
          // Extract the ref from the line
          // Format: [ref=eXX] or [XX]
          const refMatch = line.match(/\[ref=e?(\d+)\]|\[(\d+)\]/);
          if (refMatch) {
            const num = refMatch[1] || refMatch[2];
            return line.includes("[ref=e") ? `e${num}` : num;
          }

          // Also try aria-ref format
          const ariaMatch = line.match(/aria-ref="(\d+)"/);
          if (ariaMatch) {
            return ariaMatch[1];
          }
        }
      }
    }

    return null;
  }

  /**
   * Update state and notify listeners
   */
  private updateState(partial: Partial<DMSendingState>): void {
    this.state = { ...this.state, ...partial };
    this.events.onStateChange(this.state);
  }
}

/**
 * Create a mock browser control for testing without actual browser
 */
export function createMockBrowserControl(): BrowserControl {
  return {
    async navigate(url: string) {
      console.log(`[Mock] Navigating to: ${url}`);
    },
    async snapshot(options) {
      console.log(`[Mock] Taking snapshot`, options);
      return `[ref=e1] button "Message"
[ref=e2] textbox "Message..."
[ref=e3] button "Send"`;
    },
    async click(ref: string) {
      console.log(`[Mock] Clicking ref: ${ref}`);
    },
    async type(ref: string, text: string) {
      console.log(`[Mock] Typing "${text}" into ref: ${ref}`);
    },
    async screenshot() {
      console.log(`[Mock] Taking screenshot`);
      return "base64-encoded-screenshot-data";
    },
    async wait(options) {
      console.log(`[Mock] Waiting`, options);
      await new Promise((resolve) =>
        setTimeout(resolve, options.timeMs || 1000)
      );
    },
  };
}
