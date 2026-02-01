"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Send,
  X,
  Edit3,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Monitor,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type BrowserStatus =
  | "closed"
  | "opening"
  | "navigating"
  | "ready"
  | "typing"
  | "waiting_confirm"
  | "sending"
  | "sent"
  | "error";

interface DMConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  dmContent: string;
  browserStatus: BrowserStatus;
  screenshotUrl?: string;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit: () => void;
}

const statusConfig: Record<
  BrowserStatus,
  {
    label: string;
    progress: number;
    icon: React.ReactNode;
    color: string;
  }
> = {
  closed: {
    label: "準備中",
    progress: 0,
    icon: <Monitor className="w-4 h-4" />,
    color: "text-muted-foreground",
  },
  opening: {
    label: "正在開啟瀏覽器...",
    progress: 20,
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    color: "text-yellow-500",
  },
  navigating: {
    label: "正在導航到 Instagram...",
    progress: 40,
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    color: "text-yellow-500",
  },
  ready: {
    label: "已開啟個人頁面",
    progress: 50,
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: "text-green-500",
  },
  typing: {
    label: "正在輸入訊息...",
    progress: 70,
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    color: "text-yellow-500",
  },
  waiting_confirm: {
    label: "等待您確認發送",
    progress: 90,
    icon: <AlertCircle className="w-4 h-4" />,
    color: "text-primary",
  },
  sending: {
    label: "正在發送...",
    progress: 95,
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    color: "text-yellow-500",
  },
  sent: {
    label: "已發送成功！",
    progress: 100,
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: "text-green-500",
  },
  error: {
    label: "發送失敗",
    progress: 0,
    icon: <AlertCircle className="w-4 h-4" />,
    color: "text-destructive",
  },
};

export function DMConfirmationDialog({
  open,
  onOpenChange,
  username,
  dmContent,
  browserStatus,
  screenshotUrl,
  error,
  onConfirm,
  onCancel,
  onEdit,
}: DMConfirmationDialogProps) {
  const status = statusConfig[browserStatus];
  const isLoading = ["opening", "navigating", "typing", "sending"].includes(
    browserStatus
  );
  const canConfirm = browserStatus === "waiting_confirm";
  const isDone = browserStatus === "sent";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            發送 DM 給 @{username}
          </DialogTitle>
          <DialogDescription>
            OpenClaw 正在自動化 Instagram 瀏覽器操作
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn(status.color)}>{status.icon}</span>
                <span className={cn("text-sm font-medium", status.color)}>
                  {status.label}
                </span>
              </div>
              {!isDone && !error && (
                <Badge variant="outline" className="animate-pulse">
                  {status.progress}%
                </Badge>
              )}
            </div>
            {!isDone && !error && (
              <Progress value={status.progress} className="h-1.5" />
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">錯誤</span>
              </div>
              <p className="mt-1">{error}</p>
            </div>
          )}

          {/* Browser preview */}
          <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border bg-muted">
            {screenshotUrl ? (
              <motion.img
                src={screenshotUrl}
                alt="Browser screenshot"
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Monitor className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {isLoading ? "正在載入瀏覽器畫面..." : "瀏覽器預覽"}
                  </p>
                </div>
              </div>
            )}

            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    {status.label}
                  </span>
                </div>
              </div>
            )}

            {/* Success overlay */}
            {isDone && (
              <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                  <span className="text-lg font-medium text-green-500">
                    DM 發送成功！
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* DM preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                將發送的訊息內容
              </span>
              {canConfirm && (
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  <Edit3 className="w-3 h-3 mr-1" />
                  編輯
                </Button>
              )}
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50 text-sm max-h-32 overflow-y-auto">
              <p className="whitespace-pre-wrap">{dmContent}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
            <X className="w-4 h-4 mr-1" />
            取消
          </Button>
          {canConfirm && (
            <Button variant="gradient" onClick={onConfirm}>
              <Send className="w-4 h-4 mr-2" />
              確認發送
            </Button>
          )}
          {isDone && (
            <Button variant="default" onClick={() => onOpenChange(false)}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              完成
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
