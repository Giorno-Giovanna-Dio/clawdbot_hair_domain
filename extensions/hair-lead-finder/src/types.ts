/**
 * Hair Lead Finder - Type Definitions
 *
 * Types for the AI-powered lead finder workflow targeting
 * beauty & hair salon owners on Instagram.
 */

/** Raw profile data from Apify or similar scraper */
export interface ScrapedProfile {
  id: string;
  username: string;
  fullName: string;
  biography: string;
  followersCount: number;
  followsCount: number;
  postsCount: number;
  isBusinessAccount: boolean;
  businessCategoryName?: string;
  externalUrl?: string;
  externalUrls?: Array<{ title: string; url: string }>;
  profilePicUrl: string;
  verified: boolean;
  private: boolean;
  latestPosts?: Array<{
    id: string;
    type: string;
    caption: string;
    likesCount: number;
    commentsCount: number;
    timestamp: string;
  }>;
}

/** LLM analysis result for a profile */
export interface ProfileAnalysis {
  /** Unique identifier for this analysis */
  id: string;

  /** Original scraped profile data */
  profile: ScrapedProfile;

  /** Overall recommendation score (0-10) */
  score: number;

  /** Whether this profile is likely an owner/manager (not employee) */
  isLikelyOwner: boolean;

  /** Confidence level for owner detection */
  ownerConfidence: "high" | "medium" | "low";

  /** Reasons why this profile is recommended */
  reasons: string[];

  /** Detected contact methods */
  contactMethods: {
    hasEmail: boolean;
    hasPhone: boolean;
    hasLine: boolean;
    hasWebsite: boolean;
    extracted: string[];
  };

  /** Detected business signals */
  businessSignals: {
    hasBookingMentions: boolean;
    hasLocationMentions: boolean;
    mentionsServices: string[];
    averageEngagement: number;
  };

  /** Generated DM options */
  dmOptions: DMOption[];

  /** Analysis timestamp */
  analyzedAt: string;
}

/** A generated DM option */
export interface DMOption {
  /** Unique identifier */
  id: string;

  /** DM style/tone */
  style: "professional" | "friendly" | "value-focused";

  /** Display label for UI */
  label: string;

  /** The actual DM content */
  content: string;

  /** Why this style was chosen for this profile */
  rationale: string;
}

/** Workflow state for tracking progress */
export interface WorkflowState {
  /** Current step in the workflow */
  step:
    | "idle"
    | "scraping"
    | "analyzing"
    | "ready_for_review"
    | "sending_dm"
    | "completed";

  /** Progress percentage (0-100) */
  progress: number;

  /** Current status message */
  statusMessage: string;

  /** Total profiles to process */
  totalProfiles: number;

  /** Profiles processed so far */
  processedProfiles: number;

  /** Analyzed profiles ready for review */
  analyzedProfiles: ProfileAnalysis[];

  /** Profiles that have been sent DMs */
  sentDMs: Array<{
    profileId: string;
    dmOptionId: string;
    sentAt: string;
    success: boolean;
  }>;

  /** Any errors encountered */
  errors: Array<{
    profileId?: string;
    message: string;
    timestamp: string;
  }>;
}

/** Configuration for the lead finder */
export interface LeadFinderConfig {
  /** Hashtags to search for */
  hashtags: string[];

  /** Location keywords to filter by */
  locationKeywords?: string[];

  /** Minimum follower count */
  minFollowers: number;

  /** Maximum follower count */
  maxFollowers: number;

  /** Business category filter */
  businessCategories?: string[];

  /** Maximum profiles to scrape */
  maxProfiles: number;

  /** B2B user's service description (for personalizing DMs) */
  serviceDescription: string;

  /** B2B user's company name */
  companyName: string;
}

/** Browser automation state for DM sending */
export interface DMSendingState {
  /** Current profile being processed */
  currentProfile: ScrapedProfile | null;

  /** Selected DM content */
  selectedDM: DMOption | null;

  /** Browser status */
  browserStatus: "closed" | "opening" | "ready" | "typing" | "waiting_confirm";

  /** Screenshot of current state (base64) */
  screenshotBase64?: string;

  /** Error message if any */
  error?: string;
}
