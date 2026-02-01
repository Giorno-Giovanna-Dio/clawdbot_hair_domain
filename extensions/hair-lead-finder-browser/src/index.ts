/**
 * Hair Lead Finder (Browser Version) - Main Entry Point
 *
 * AI-powered lead finder that uses OpenClaw browser automation
 * to crawl Instagram directly, without external scraping services.
 *
 * @example
 * ```typescript
 * import { InstagramCrawler } from '@openclaw/hair-lead-finder-browser';
 *
 * const crawler = new InstagramCrawler(
 *   openclawBrowser, // OpenClaw browser instance
 *   {
 *     hashtags: ['美髮沙龍', '台北美髮'],
 *     maxProfiles: 50,
 *     minFollowers: 1000,
 *     maxFollowers: 50000,
 *     actionDelayMs: 2000,
 *     companyName: 'BookingPro',
 *     serviceDescription: '線上預約系統',
 *     llmApiKey: process.env.OPENAI_API_KEY!,
 *     llmModel: 'gpt-4o-mini',
 *   },
 *   {
 *     onStateChange: (state) => console.log(state.message),
 *     onLeadDiscovered: (lead) => console.log('Found:', lead.profile.username),
 *     onProfileSkipped: (username, reason) => console.log('Skipped:', username),
 *     onError: (error) => console.error(error),
 *   }
 * );
 *
 * const leads = await crawler.start();
 * ```
 */

// Export types
export * from "./types.js";

// Export crawler
export { InstagramCrawler } from "./ig-crawler.js";
export type { OpenClawBrowser } from "./ig-crawler.js";

// Export analyzer
export { ProfileAnalyzer } from "./analyzer.js";

// Version
export const VERSION = "0.1.0";
