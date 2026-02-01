# Hair Lead Finder

AI-powered lead finder for beauty & hair salon owners on Instagram.

## Overview

This extension helps B2B businesses find and reach out to beauty/hair salon owners on Instagram. It combines:

1. **Profile Scraping** - Uses Apify to search Instagram by hashtags
2. **LLM Analysis** - Claude analyzes profiles to identify salon owners
3. **DM Generation** - Creates personalized outreach messages
4. **Semi-automated Sending** - Uses OpenClaw browser for DM with user confirmation

## Features

- 🔍 Search Instagram by industry-specific hashtags
- 🤖 AI-powered filtering to identify decision-makers (owners, not employees)
- 💬 Generate 3 personalized DM options per lead
- 📊 Score and rank leads by conversion potential
- 🌐 Visual workflow like Cursor - see progress in real-time
- ✅ Semi-automated DM with user confirmation before sending

## Installation

```bash
cd extensions/hair-lead-finder
pnpm install
```

## Quick Start

```typescript
import { LeadFinderWorkflow } from '@openclaw/hair-lead-finder';

const workflow = new LeadFinderWorkflow(
  {
    hashtags: ['美髮沙龍', '台北美髮'],
    minFollowers: 1000,
    maxFollowers: 50000,
    maxProfiles: 100,
    serviceDescription: '線上預約系統',
    companyName: 'BookingPro',
  },
  {
    onStateChange: (state) => updateUI(state),
    onAnalysisComplete: (leads) => showLeads(leads),
    onError: (error) => handleError(error),
  },
  {
    apifyClient: yourApifyClient,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  }
);

const leads = await workflow.run();
```

## Demo

Run the demo to see the workflow in action with mock data:

```bash
bun run src/demo.ts
```

## Configuration

| Option | Description | Default |
|--------|-------------|---------|
| `hashtags` | Instagram hashtags to search | Required |
| `minFollowers` | Minimum follower count | 1000 |
| `maxFollowers` | Maximum follower count | 50000 |
| `maxProfiles` | Max profiles to analyze | 100 |
| `serviceDescription` | Your B2B service description | Required |
| `companyName` | Your company name | Required |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Web Dashboard                     │
│  (React/Next.js - workflow visualization)           │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              LeadFinderWorkflow                      │
│  - Orchestrates the complete process                │
│  - Emits progress events for UI                     │
└─────────────────────────────────────────────────────┘
          │                           │
          ▼                           ▼
┌──────────────────┐      ┌──────────────────────────┐
│   Apify Client   │      │    ProfileAnalyzer       │
│  (Scraping)      │      │    (LLM Analysis)        │
└──────────────────┘      └──────────────────────────┘
                                      │
                                      ▼
                          ┌──────────────────────────┐
                          │      DMSender            │
                          │  (OpenClaw Browser)      │
                          └──────────────────────────┘
```

## API Reference

### LeadFinderWorkflow

Main orchestrator class.

```typescript
class LeadFinderWorkflow {
  constructor(
    config: LeadFinderConfig,
    events: WorkflowEvents,
    options: { apifyClient: ApifyClient; anthropicApiKey?: string }
  );

  run(): Promise<ProfileAnalysis[]>;
  getState(): WorkflowState;
  recordSentDM(profileId: string, dmOptionId: string, success: boolean): void;
}
```

### ProfileAnalyzer

LLM-powered profile analysis.

```typescript
class ProfileAnalyzer {
  constructor(options?: { anthropicApiKey?: string; model?: string });

  analyzeProfile(
    profile: ScrapedProfile,
    config: LeadFinderConfig
  ): Promise<ProfileAnalysis>;

  analyzeProfiles(
    profiles: ScrapedProfile[],
    config: LeadFinderConfig,
    onProgress?: (current: number, total: number) => void
  ): Promise<ProfileAnalysis[]>;
}
```

### DMSender

Semi-automated DM sending with OpenClaw browser.

```typescript
class DMSender {
  constructor(browser: BrowserControl, events: DMSenderEvents);

  sendDM(profile: ScrapedProfile, dm: DMOption): Promise<boolean>;
}
```

## Cost Estimation

| Component | Cost |
|-----------|------|
| Apify Instagram Scraper | ~$1.50-2.30 / 1000 profiles |
| Claude API (analysis) | ~$0.003 / profile (sonnet) |
| OpenClaw | Self-hosted (free) |

For 100 leads: ~$0.50-1.00 total

## Legal Considerations

- Only scrapes publicly available data
- User confirmation required before each DM
- Respects Instagram's rate limits
- Does not access private accounts

## License

Part of OpenClaw - Apache 2.0
