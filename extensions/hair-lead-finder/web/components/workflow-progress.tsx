"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Brain,
  CheckCircle2,
  Send,
  Loader2,
  Circle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type WorkflowStep =
  | "idle"
  | "scraping"
  | "analyzing"
  | "ready_for_review"
  | "sending_dm"
  | "completed";

interface WorkflowProgressProps {
  currentStep: WorkflowStep;
  progress: number;
  statusMessage: string;
  stats?: {
    totalProfiles: number;
    processedProfiles: number;
    recommendedCount: number;
    sentCount: number;
  };
}

const steps = [
  {
    id: "scraping",
    label: "搜尋 Instagram",
    description: "從 hashtag 尋找相關帳號",
    icon: Search,
  },
  {
    id: "analyzing",
    label: "AI 分析",
    description: "識別潛在客戶並生成 DM",
    icon: Brain,
  },
  {
    id: "ready_for_review",
    label: "等待審核",
    description: "準備好讓您審核推薦名單",
    icon: CheckCircle2,
  },
  {
    id: "sending_dm",
    label: "發送 DM",
    description: "自動發送合作邀約",
    icon: Send,
  },
];

function getStepStatus(
  stepId: string,
  currentStep: WorkflowStep
): "completed" | "current" | "pending" {
  const stepOrder = ["scraping", "analyzing", "ready_for_review", "sending_dm"];
  const currentIndex = stepOrder.indexOf(currentStep);
  const stepIndex = stepOrder.indexOf(stepId);

  if (currentStep === "idle") return "pending";
  if (currentStep === "completed") return "completed";
  if (stepIndex < currentIndex) return "completed";
  if (stepIndex === currentIndex) return "current";
  return "pending";
}

export function WorkflowProgress({
  currentStep,
  progress,
  statusMessage,
  stats,
}: WorkflowProgressProps) {
  return (
    <Card className="glass border-border/50">
      <CardContent className="pt-6">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              整體進度
            </span>
            <span className="text-sm font-bold text-primary">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Status message */}
        <AnimatePresence mode="wait">
          <motion.div
            key={statusMessage}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="text-center mb-6"
          >
            <p className="text-lg font-medium">{statusMessage}</p>
          </motion.div>
        </AnimatePresence>

        {/* Step indicators */}
        <div className="grid grid-cols-4 gap-4">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id, currentStep);
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex flex-col items-center">
                <motion.div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all",
                    status === "completed" &&
                      "bg-green-500/20 text-green-500 border border-green-500/30",
                    status === "current" &&
                      "bg-primary/20 text-primary border border-primary/30",
                    status === "pending" &&
                      "bg-muted text-muted-foreground border border-border"
                  )}
                  animate={
                    status === "current"
                      ? {
                          scale: [1, 1.05, 1],
                          transition: { repeat: Infinity, duration: 2 },
                        }
                      : {}
                  }
                >
                  {status === "current" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : status === "completed" ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </motion.div>
                <span
                  className={cn(
                    "text-xs font-medium text-center",
                    status === "current" && "text-primary",
                    status === "completed" && "text-green-500",
                    status === "pending" && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-muted-foreground text-center mt-0.5 hidden sm:block">
                  {step.description}
                </span>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {stats.totalProfiles}
              </div>
              <div className="text-xs text-muted-foreground">總帳號數</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {stats.processedProfiles}
              </div>
              <div className="text-xs text-muted-foreground">已分析</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {stats.recommendedCount}
              </div>
              <div className="text-xs text-muted-foreground">推薦名單</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.sentCount}
              </div>
              <div className="text-xs text-muted-foreground">已發送 DM</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
