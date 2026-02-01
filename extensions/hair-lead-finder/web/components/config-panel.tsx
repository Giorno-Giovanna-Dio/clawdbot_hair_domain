"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Hash,
  Users,
  Building2,
  FileText,
  Play,
  Settings2,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ConfigPanelProps {
  onStart: (config: SearchConfig) => void;
  isRunning: boolean;
}

export interface SearchConfig {
  hashtags: string[];
  minFollowers: number;
  maxFollowers: number;
  maxProfiles: number;
  businessCategories: string[];
  companyName: string;
  serviceDescription: string;
}

const defaultConfig: SearchConfig = {
  hashtags: ["美髮沙龍", "台北美髮", "髮型設計", "染髮"],
  minFollowers: 1000,
  maxFollowers: 50000,
  maxProfiles: 50,
  businessCategories: ["美髮", "沙龍", "Hair"],
  companyName: "預約通 BookingPro",
  serviceDescription:
    "我們提供美容美髮業專用的線上預約系統，可以自動化管理預約、提醒客戶、追蹤營收等功能。",
};

export function ConfigPanel({ onStart, isRunning }: ConfigPanelProps) {
  const [config, setConfig] = useState<SearchConfig>(defaultConfig);
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-primary" />
          搜尋設定
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hashtags */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Hash className="w-4 h-4 text-muted-foreground" />
            搜尋 Hashtags
          </label>
          <div className="flex flex-wrap gap-2">
            {config.hashtags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-sm">
                #{tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Follower range */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            追蹤者範圍
          </label>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="px-3 py-1.5 rounded-md bg-muted">
              {config.minFollowers.toLocaleString()}
            </span>
            <span>到</span>
            <span className="px-3 py-1.5 rounded-md bg-muted">
              {config.maxFollowers.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Company info */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            您的服務
          </label>
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <p className="font-medium">{config.companyName}</p>
            <p className="text-muted-foreground mt-1 line-clamp-2">
              {config.serviceDescription}
            </p>
          </div>
        </div>

        {/* Advanced settings toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-muted-foreground"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          進階設定
          <motion.div
            animate={{ rotate: showAdvanced ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </Button>

        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-3 text-sm"
          >
            <div className="flex justify-between">
              <span className="text-muted-foreground">最大搜尋數</span>
              <span>{config.maxProfiles} 個帳號</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">商業類別篩選</span>
              <span>{config.businessCategories.join(", ")}</span>
            </div>
          </motion.div>
        )}

        {/* Start button */}
        <Button
          className="w-full"
          variant="gradient"
          size="lg"
          onClick={() => onStart(config)}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="mr-2"
              >
                ⏳
              </motion.div>
              執行中...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              開始搜尋潛在客戶
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
