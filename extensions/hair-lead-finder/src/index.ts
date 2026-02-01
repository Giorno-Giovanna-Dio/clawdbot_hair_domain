/**
 * Hair Lead Finder - Main Entry Point
 *
 * AI-powered lead finder for beauty & hair salon owners on Instagram.
 *
 * This extension provides:
 * 1. Profile scraping via Apify API
 * 2. LLM-powered analysis to identify salon owners
 * 3. Personalized DM generation
 * 4. Semi-automated DM sending with OpenClaw browser
 *
 * @example
 * ```typescript
 * import { LeadFinderWorkflow, createMockApifyClient } from '@openclaw/hair-lead-finder';
 *
 * const workflow = new LeadFinderWorkflow(
 *   {
 *     hashtags: ['美髮沙龍', '台北美髮', '髮型設計'],
 *     minFollowers: 1000,
 *     maxFollowers: 50000,
 *     maxProfiles: 100,
 *     serviceDescription: '我們提供美容美髮業專用的線上預約系統',
 *     companyName: 'BookingPro',
 *   },
 *   {
 *     onStateChange: (state) => console.log('State:', state.statusMessage),
 *     onAnalysisComplete: (analyses) => console.log('Found leads:', analyses.length),
 *     onError: (error) => console.error('Error:', error),
 *   },
 *   {
 *     apifyClient: createMockApifyClient(), // or real Apify client
 *   }
 * );
 *
 * const leads = await workflow.run();
 * ```
 */

// Export types
export * from "./types.js";

// Export analyzer
export { ProfileAnalyzer } from "./analyzer.js";

// Export DM sender
export { DMSender, createMockBrowserControl } from "./dm-sender.js";
export type { DMSenderEvents } from "./dm-sender.js";

// Export workflow
export {
  LeadFinderWorkflow,
  createMockApifyClient,
} from "./workflow.js";
export type { WorkflowEvents } from "./workflow.js";

// Version info
export const VERSION = "0.1.0";
