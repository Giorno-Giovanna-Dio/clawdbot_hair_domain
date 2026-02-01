"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Users,
  Image as ImageIcon,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  Calendar,
  TrendingUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Send,
  MessageCircle,
  Sparkles,
  X,
  Eye,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatNumber, getScoreColor, getScoreBgColor } from "@/lib/utils";

interface DMOption {
  id: string;
  style: "professional" | "friendly" | "value-focused";
  label: string;
  content: string;
  rationale: string;
}

interface ProfileAnalysis {
  id: string;
  profile: {
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
    profilePicUrl: string;
    verified: boolean;
  };
  score: number;
  isLikelyOwner: boolean;
  ownerConfidence: "high" | "medium" | "low";
  reasons: string[];
  contactMethods: {
    hasEmail: boolean;
    hasPhone: boolean;
    hasLine: boolean;
    hasWebsite: boolean;
    extracted: string[];
  };
  businessSignals: {
    hasBookingMentions: boolean;
    hasLocationMentions: boolean;
    mentionsServices: string[];
    averageEngagement: number;
  };
  dmOptions: DMOption[];
}

interface LeadCardProps {
  analysis: ProfileAnalysis;
  onSendDM: (analysis: ProfileAnalysis, dm: DMOption) => void;
  onSkip: (analysis: ProfileAnalysis) => void;
  onViewProfile: (analysis: ProfileAnalysis) => void;
  isSending?: boolean;
}

const styleIcons = {
  professional: "💼",
  friendly: "😊",
  "value-focused": "💎",
};

const styleLabels = {
  professional: "專業商務",
  friendly: "親切對話",
  "value-focused": "價值導向",
};

export function LeadCard({
  analysis,
  onSendDM,
  onSkip,
  onViewProfile,
  isSending = false,
}: LeadCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedDM, setSelectedDM] = useState<string | null>(null);
  const { profile, score, reasons, contactMethods, businessSignals, dmOptions } =
    analysis;

  const confidenceColors = {
    high: "text-green-500",
    medium: "text-yellow-500",
    low: "text-red-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
    >
      <Card className="glass border-border/50 overflow-hidden hover:border-primary/30 transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            {/* Profile info */}
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 ring-2 ring-primary/20">
                <AvatarImage src={profile.profilePicUrl} alt={profile.username} />
                <AvatarFallback>
                  <User className="w-6 h-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">@{profile.username}</CardTitle>
                  {profile.verified && (
                    <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{profile.fullName}</p>
                {profile.businessCategoryName && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {profile.businessCategoryName}
                  </Badge>
                )}
              </div>
            </div>

            {/* Score */}
            <div
              className={cn(
                "flex flex-col items-center p-3 rounded-xl border",
                getScoreBgColor(score)
              )}
            >
              <span className={cn("text-2xl font-bold", getScoreColor(score))}>
                {score.toFixed(1)}
              </span>
              <span className="text-[10px] text-muted-foreground">推薦分數</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{formatNumber(profile.followersCount)} 追蹤者</span>
            </div>
            <div className="flex items-center gap-1">
              <ImageIcon className="w-4 h-4" />
              <span>{profile.postsCount} 貼文</span>
            </div>
            {profile.isBusinessAccount && (
              <Badge variant="outline" className="text-xs">
                商業帳號
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Bio */}
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <p className="whitespace-pre-wrap line-clamp-3">{profile.biography}</p>
          </div>

          {/* Reasons */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">AI 推薦原因</span>
            </div>
            <ul className="space-y-1">
              {reasons.slice(0, 3).map((reason, i) => (
                <li
                  key={i}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-primary">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact methods */}
          <div className="flex items-center gap-2 flex-wrap">
            {contactMethods.hasEmail && (
              <Badge variant="success" className="text-xs">
                <Mail className="w-3 h-3 mr-1" /> Email
              </Badge>
            )}
            {contactMethods.hasPhone && (
              <Badge variant="success" className="text-xs">
                <Phone className="w-3 h-3 mr-1" /> 電話
              </Badge>
            )}
            {contactMethods.hasLine && (
              <Badge variant="success" className="text-xs">
                💬 Line
              </Badge>
            )}
            {contactMethods.hasWebsite && (
              <Badge variant="success" className="text-xs">
                <Globe className="w-3 h-3 mr-1" /> 網站
              </Badge>
            )}
            {businessSignals.hasBookingMentions && (
              <Badge variant="warning" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" /> 提到預約
              </Badge>
            )}
          </div>

          {/* Expandable DM options */}
          <div className="border-t border-border/50 pt-4">
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => setExpanded(!expanded)}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span>選擇合作邀約 DM</span>
              </div>
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Tabs
                    defaultValue={dmOptions[0]?.id}
                    className="mt-4"
                    onValueChange={setSelectedDM}
                  >
                    <TabsList className="w-full grid grid-cols-3">
                      {dmOptions.map((dm) => (
                        <TabsTrigger key={dm.id} value={dm.id} className="text-xs">
                          {styleIcons[dm.style]} {styleLabels[dm.style]}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {dmOptions.map((dm) => (
                      <TabsContent key={dm.id} value={dm.id}>
                        <div className="space-y-3 mt-3">
                          <p className="text-xs text-muted-foreground italic">
                            {dm.rationale}
                          </p>
                          <div className="p-4 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap border border-border/50">
                            {dm.content}
                          </div>
                          <Button
                            className="w-full"
                            variant="gradient"
                            onClick={() => onSendDM(analysis, dm)}
                            disabled={isSending}
                          >
                            {isSending ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 1,
                                    ease: "linear",
                                  }}
                                  className="mr-2"
                                >
                                  ⏳
                                </motion.div>
                                準備發送中...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                發送這則 DM
                              </>
                            )}
                          </Button>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>

        <CardFooter className="border-t border-border/50 pt-4 flex justify-between">
          <Button variant="ghost" size="sm" onClick={() => onSkip(analysis)}>
            <X className="w-4 h-4 mr-1" />
            跳過
          </Button>
          <Button variant="outline" size="sm" onClick={() => onViewProfile(analysis)}>
            <Eye className="w-4 h-4 mr-1" />
            查看 IG
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
