# Hair Lead Finder (Browser Version)

AI-powered lead finder that uses **OpenClaw browser automation** to crawl Instagram directly - **no external scraper needed**.

## Key Difference

| 版本 | 資料來源 | 費用 |
|------|----------|------|
| `hair-lead-finder` | Apify API | ~$1.50-2.30/1000 profiles |
| `hair-lead-finder-browser` ⭐ | OpenClaw Browser | **免費** (只有 LLM 費用) |

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenClaw Browser                          │
│                                                             │
│   1. 搜尋 #hashtag ──► 2. 點擊貼文 ──► 3. 查看 Profile      │
│                                        │                    │
│                                        ▼                    │
│                              4. browser.snapshot()          │
│                                        │                    │
│                                        ▼                    │
│                              5. LLM 分析 (GPT/Claude)       │
│                                        │                    │
│                            ┌───────────┴───────────┐        │
│                            ▼                       ▼        │
│                       是潛在客戶              不是 → 跳過   │
│                            │                                │
│                            ▼                                │
│                    6. 保存 + 生成 DM                        │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **OpenClaw Gateway** running with browser enabled
2. **Instagram logged in** in the OpenClaw browser profile
3. **LLM API Key** (OpenAI or compatible)

## Quick Start

### 1. Setup OpenClaw Browser

```bash
# Start OpenClaw gateway (if not already running)
openclaw gateway run

# Login to Instagram in OpenClaw browser
openclaw browser start
openclaw browser open https://www.instagram.com/
# Manually login in the browser window
```

### 2. Set API Key

```bash
export OPENAI_API_KEY="your-openai-api-key"
```

### 3. Run Demo

```bash
cd extensions/hair-lead-finder-browser
bun run demo
```

## Configuration

```typescript
const config = {
  // Search settings
  hashtags: ['美髮沙龍', '台北美髮', '染髮'],
  maxProfiles: 50,
  minFollowers: 1000,
  maxFollowers: 50000,

  // Timing (to appear human-like)
  actionDelayMs: 2000, // Delay between actions

  // Your business info (for personalized DMs)
  companyName: '預約通 BookingPro',
  serviceDescription: '線上預約系統',

  // LLM settings
  llmApiKey: process.env.OPENAI_API_KEY!,
  llmModel: 'gpt-4o-mini', // or 'gpt-4o', 'claude-3-sonnet-20240229'
  llmBaseUrl: undefined, // Set for OpenAI-compatible APIs
};
```

## LLM Options

| Provider | Model | Cost (per 1M tokens) | Recommended For |
|----------|-------|---------------------|-----------------|
| OpenAI | `gpt-4o-mini` | $0.15 in / $0.6 out | 日常使用 (便宜) |
| OpenAI | `gpt-4o` | $5 in / $15 out | 高精度分析 |
| Anthropic | `claude-3-sonnet` | $3 in / $15 out | 最佳分析品質 |
| Anthropic | `claude-3-haiku` | $0.25 in / $1.25 out | 快速便宜 |

### Using Claude

```typescript
import Anthropic from '@anthropic-ai/sdk';

// For Claude, use the Anthropic SDK directly
// Or use an OpenAI-compatible wrapper like LiteLLM
const config = {
  llmApiKey: process.env.ANTHROPIC_API_KEY!,
  llmModel: 'claude-3-sonnet-20240229',
  llmBaseUrl: 'https://api.anthropic.com/v1', // If using proxy
};
```

## Usage Example

```typescript
import { InstagramCrawler } from '@openclaw/hair-lead-finder-browser';

// Connect to OpenClaw browser
const browser = await connectToOpenClawBrowser();

const crawler = new InstagramCrawler(browser, config, {
  onStateChange: (state) => {
    console.log(`${state.status}: ${state.message}`);
    console.log(`Analyzed: ${state.profilesAnalyzed}, Found: ${state.leadsDiscovered}`);
  },

  onLeadDiscovered: (lead) => {
    console.log(`🎯 Found lead: @${lead.profile.username}`);
    console.log(`   Score: ${lead.analysis.score}/10`);
    console.log(`   Reasons: ${lead.analysis.reasons.join(', ')}`);

    // Save to database or display in UI
    saveLead(lead);
  },

  onProfileSkipped: (username, reason) => {
    console.log(`Skipped @${username}: ${reason}`);
  },

  onError: (error) => {
    console.error('Crawler error:', error);
  },
});

const leads = await crawler.start();
console.log(`Found ${leads.length} leads!`);
```

## Cost Comparison

For 100 profiles:

| Item | Apify Version | Browser Version |
|------|---------------|-----------------|
| Profile Data | ~$0.23 | **$0** |
| LLM Analysis | ~$0.02 | ~$0.02 |
| **Total** | **~$0.25** | **~$0.02** |

**Browser version is ~92% cheaper!**

## Limitations

1. **Speed**: Browser automation is slower than API (~3-5 seconds per profile)
2. **Login Required**: Need to login to Instagram in OpenClaw browser
3. **Rate Limits**: Must add delays to avoid Instagram detection
4. **Session Management**: Need to handle login sessions

## Best Practices

1. **Use realistic delays**: Set `actionDelayMs: 2000` or higher
2. **Don't run too long**: Take breaks every 50-100 profiles
3. **Monitor for blocks**: Watch for CAPTCHA or login prompts
4. **Use a dedicated profile**: Don't mix with personal Instagram use

## Integration with Web Dashboard

This module can be integrated with the Web Dashboard from `hair-lead-finder`:

```typescript
// In your Next.js API route
import { InstagramCrawler } from '@openclaw/hair-lead-finder-browser';

export async function POST(req: Request) {
  const config = await req.json();

  const browser = await getOpenClawBrowser();
  const crawler = new InstagramCrawler(browser, config, {
    onLeadDiscovered: (lead) => {
      // Send to frontend via WebSocket or Server-Sent Events
      broadcastToClients({ type: 'lead', data: lead });
    },
    // ...
  });

  await crawler.start();
}
```

## License

Part of OpenClaw - Apache 2.0
