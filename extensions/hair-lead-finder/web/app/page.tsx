"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Filter, SortDesc, RefreshCw } from "lucide-react";
import { Header } from "@/components/header";
import { ConfigPanel, type SearchConfig } from "@/components/config-panel";
import {
  WorkflowProgress,
  type WorkflowStep,
} from "@/components/workflow-progress";
import { LeadCard } from "@/components/lead-card";
import { DMConfirmationDialog } from "@/components/dm-confirmation-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Mock data for demonstration
const mockLeads = [
  {
    id: "analysis-1",
    profile: {
      id: "123456789",
      username: "beautysalon_taipei",
      fullName: "小美髮廊 BeautySalon",
      biography:
        "✨ 專業美髮沙龍 | 創辦人 Amy\n📍 台北市大安區忠孝東路四段\n📞 預約專線: 02-2711-5678\n💇‍♀️ 染燙護專業服務\n🎨 日系漸層染 | 韓系髮型\nLine: beautysalon_tw",
      followersCount: 5234,
      followsCount: 423,
      postsCount: 892,
      isBusinessAccount: true,
      businessCategoryName: "美髮沙龍",
      externalUrl: "https://beautysalon.com.tw",
      profilePicUrl:
        "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=150&h=150&fit=crop",
      verified: false,
    },
    score: 9.2,
    isLikelyOwner: true,
    ownerConfidence: "high" as const,
    reasons: [
      "Bio 明確標示「創辦人」，確認為經營者帳號",
      "提供完整聯絡方式（電話、Line），顯示商業意圖",
      "近期貼文多次提到「預約已滿」，表示有管理需求",
      "5K+ 追蹤者，規模適中，適合導入預約系統",
      "日系/韓系專業定位，客單價可能較高",
    ],
    contactMethods: {
      hasEmail: false,
      hasPhone: true,
      hasLine: true,
      hasWebsite: true,
      extracted: ["02-2711-5678", "beautysalon_tw"],
    },
    businessSignals: {
      hasBookingMentions: true,
      hasLocationMentions: true,
      mentionsServices: ["染髮", "燙髮", "護髮", "日系漸層染"],
      averageEngagement: 4.2,
    },
    dmOptions: [
      {
        id: "dm-1-pro",
        style: "professional" as const,
        label: "專業商務風格",
        content: `小美髮廊 您好！

我是預約通 BookingPro 的合作夥伴，專門協助像您這樣用心經營的美髮沙龍提升預約管理效率。

看到您的作品真的很精緻，特別是那些日系漸層染的作品！也注意到您的預約常常額滿，想與您分享一個能讓您專注創作、減少行政負擔的解決方案。

我們的系統可以：
• 自動發送預約提醒給客戶
• 線上預約，24小時不漏單
• 客戶資料管理與回訪追蹤

方便的話，可以私訊了解更多嗎？也可以先免費試用看看 😊`,
        rationale:
          "帳號經營專業度高，適合以商務角度切入，強調效率提升",
      },
      {
        id: "dm-1-friendly",
        style: "friendly" as const,
        label: "親切對話風格",
        content: `嗨～看到您的作品真的好美！特別是那個漸層染髮 🎨

不好意思冒昧打擾，我們有個預約系統最近在找美髮沙龍合作，想說您的店預約好像都很滿，不知道有沒有興趣了解一下？

可以讓客人自己線上預約，您就不用一直回訊息了～

有興趣的話再聊聊？沒興趣也沒關係喔 ❤️`,
        rationale:
          "經營者可能較忙碌，以輕鬆友善的方式較不會造成壓力",
      },
      {
        id: "dm-1-value",
        style: "value-focused" as const,
        label: "價值導向風格",
        content: `您好！注意到小美髮廊的好口碑 ⭐

想分享一個免費試用機會：

我們的預約系統可以幫您：
✅ 減少 80% 的預約確認時間
✅ 降低客人爽約率
✅ 自動追蹤回訪客戶

現在有 30 天免費試用，完全沒有綁約。

有興趣了解嗎？`,
        rationale: "直接強調具體價值和免費試用，適合決策導向的經營者",
      },
    ],
    analyzedAt: new Date().toISOString(),
  },
  {
    id: "analysis-2",
    profile: {
      id: "987654321",
      username: "hairmaster_kaohsiung",
      fullName: "高雄髮型設計師 小王",
      biography:
        "🎨 髮型設計師 10年經驗\n💈 Hair Master 店長\n🏆 2023美髮大賽冠軍\n📍 高雄市新興區\nLine: hairmaster888",
      followersCount: 8900,
      followsCount: 567,
      postsCount: 1234,
      isBusinessAccount: true,
      businessCategoryName: "個人部落格",
      externalUrl: undefined,
      profilePicUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
      verified: false,
    },
    score: 8.5,
    isLikelyOwner: true,
    ownerConfidence: "high" as const,
    reasons: [
      "明確標示「店長」身份",
      "10年經驗 + 比賽得獎，專業度高",
      "8.9K 追蹤者，有一定影響力",
      "提供 Line 聯繫方式",
    ],
    contactMethods: {
      hasEmail: false,
      hasPhone: false,
      hasLine: true,
      hasWebsite: false,
      extracted: ["hairmaster888"],
    },
    businessSignals: {
      hasBookingMentions: false,
      hasLocationMentions: true,
      mentionsServices: ["髮型設計"],
      averageEngagement: 3.8,
    },
    dmOptions: [
      {
        id: "dm-2-pro",
        style: "professional" as const,
        label: "專業商務風格",
        content: `小王 店長您好！

恭喜您獲得 2023 美髮大賽冠軍 🏆

我是預約通的合作夥伴，想與您分享一個專為專業髮型設計師打造的預約管理工具。

方便聊聊嗎？`,
        rationale: "強調專業成就，建立平等對話基礎",
      },
      {
        id: "dm-2-friendly",
        style: "friendly" as const,
        label: "親切對話風格",
        content: `哇～看到您是美髮大賽冠軍耶！作品都好厲害 👏

不知道您有沒有在用什麼預約系統呢？我們最近有在找高雄的美髮沙龍合作～

有興趣聊聊嗎？`,
        rationale: "以欣賞作品作為開場，降低商業感",
      },
      {
        id: "dm-2-value",
        style: "value-focused" as const,
        label: "價值導向風格",
        content: `店長您好！

30天免費試用預約系統：
• 線上預約，不漏接客人
• 自動提醒，減少爽約
• 業績報表，一目瞭然

冠軍級的服務，值得冠軍級的工具 🏆

有興趣嗎？`,
        rationale: "結合獎項成就，強調匹配度",
      },
    ],
    analyzedAt: new Date().toISOString(),
  },
];

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

export default function Dashboard() {
  // Workflow state
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>("idle");
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("準備就緒");
  const [leads, setLeads] = useState<typeof mockLeads>([]);

  // DM sending state
  const [sendingLeadId, setSendingLeadId] = useState<string | null>(null);
  const [dmDialogOpen, setDmDialogOpen] = useState(false);
  const [currentDM, setCurrentDM] = useState<{
    username: string;
    content: string;
    leadId: string;
  } | null>(null);
  const [browserStatus, setBrowserStatus] = useState<BrowserStatus>("closed");
  const [sentCount, setSentCount] = useState(0);

  // Stats
  const stats = {
    totalProfiles: leads.length > 0 ? 50 : 0,
    processedProfiles: leads.length > 0 ? 50 : 0,
    recommendedCount: leads.length,
    sentCount,
  };

  // Simulate workflow
  const handleStart = useCallback(async (config: SearchConfig) => {
    setWorkflowStep("scraping");
    setStatusMessage("正在搜尋 Instagram 相關帳號...");
    setProgress(10);

    await sleep(2000);
    setProgress(30);
    setStatusMessage("找到 50 個帳號，開始 AI 分析...");

    setWorkflowStep("analyzing");
    for (let i = 0; i < 10; i++) {
      await sleep(300);
      setProgress(30 + i * 6);
      setStatusMessage(`AI 分析中... (${(i + 1) * 5}/50)`);
    }

    setProgress(95);
    setStatusMessage("分析完成，準備推薦名單...");
    await sleep(500);

    setLeads(mockLeads);
    setProgress(100);
    setStatusMessage(`找到 ${mockLeads.length} 個推薦的潛在客戶！`);
    setWorkflowStep("ready_for_review");
  }, []);

  // Handle send DM - just open the dialog
  const handleSendDM = useCallback(
    (analysis: (typeof mockLeads)[0], dm: (typeof mockLeads)[0]["dmOptions"][0]) => {
      setCurrentDM({
        username: analysis.profile.username,
        content: dm.content,
        leadId: analysis.id,
      });
      setSendingLeadId(analysis.id);
      setBrowserStatus("opening");
      setWorkflowStep("sending_dm");
      setStatusMessage(`正在發送 DM 給 @${analysis.profile.username}...`);
      setDmDialogOpen(true);
    },
    []
  );

  // Simulate browser automation when dialog opens
  useEffect(() => {
    if (!dmDialogOpen || browserStatus !== "opening") return;

    const runSimulation = async () => {
      await sleep(1500);
      setBrowserStatus("navigating");

      await sleep(2000);
      setBrowserStatus("ready");

      await sleep(1000);
      setBrowserStatus("typing");

      await sleep(2000);
      setBrowserStatus("waiting_confirm");
      setSendingLeadId(null); // Stop the loading state on the card
    };

    runSimulation();
  }, [dmDialogOpen, browserStatus]);

  // Handle DM confirmation
  const handleConfirmDM = useCallback(async () => {
    setBrowserStatus("sending");
    await sleep(1500);
    setBrowserStatus("sent");
    
    // Update stats
    setSentCount((prev) => prev + 1);
    
    // Remove the lead from the list after successful send
    if (currentDM?.leadId) {
      setLeads((prev) => prev.filter((l) => l.id !== currentDM.leadId));
    }
    
    // Update workflow status
    setStatusMessage("DM 發送成功！");
  }, [currentDM?.leadId]);

  // Handle dialog close after sent
  const handleDialogClose = useCallback((open: boolean) => {
    if (!open) {
      // If closing after sent, reset to ready_for_review
      if (browserStatus === "sent") {
        setWorkflowStep("ready_for_review");
        setStatusMessage(`已發送 ${sentCount + 1} 則 DM，還有 ${leads.length - 1} 個待處理`);
      } else {
        setWorkflowStep("ready_for_review");
        setStatusMessage("已取消發送");
      }
      setBrowserStatus("closed");
      setSendingLeadId(null);
    }
    setDmDialogOpen(open);
  }, [browserStatus, sentCount, leads.length]);

  const handleCancelDM = useCallback(() => {
    setDmDialogOpen(false);
    setSendingLeadId(null);
    setBrowserStatus("closed");
    setWorkflowStep("ready_for_review");
    setStatusMessage("已取消發送");
  }, []);

  const handleSkip = useCallback((analysis: (typeof mockLeads)[0]) => {
    setLeads((prev) => prev.filter((l) => l.id !== analysis.id));
  }, []);

  const handleViewProfile = useCallback((analysis: (typeof mockLeads)[0]) => {
    window.open(
      `https://www.instagram.com/${analysis.profile.username}/`,
      "_blank"
    );
  }, []);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container py-8">
        <div className="grid lg:grid-cols-[350px_1fr] gap-8">
          {/* Left sidebar */}
          <div className="space-y-6">
            <ConfigPanel
              onStart={handleStart}
              isRunning={
                workflowStep !== "idle" && workflowStep !== "ready_for_review"
              }
            />

            <WorkflowProgress
              currentStep={workflowStep}
              progress={progress}
              statusMessage={statusMessage}
              stats={stats}
            />
          </div>

          {/* Main content */}
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">AI 推薦名單</h2>
                {leads.length > 0 && (
                  <Badge variant="secondary">{leads.length} 個</Badge>
                )}
              </div>

              {leads.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-1" />
                    篩選
                  </Button>
                  <Button variant="outline" size="sm">
                    <SortDesc className="w-4 h-4 mr-1" />
                    排序
                  </Button>
                </div>
              )}
            </div>

            {/* Leads list */}
            <AnimatePresence>
              {leads.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">尚未開始搜尋</h3>
                  <p className="text-muted-foreground max-w-md">
                    設定搜尋條件並點擊「開始搜尋」，AI 將會自動分析 Instagram
                    帳號並推薦最適合的潛在客戶給您。
                  </p>
                </motion.div>
              ) : (
                <div className="grid gap-6">
                  {leads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      analysis={lead}
                      onSendDM={handleSendDM}
                      onSkip={handleSkip}
                      onViewProfile={handleViewProfile}
                      isSending={sendingLeadId === lead.id}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* DM Confirmation Dialog */}
      <DMConfirmationDialog
        open={dmDialogOpen}
        onOpenChange={handleDialogClose}
        username={currentDM?.username || ""}
        dmContent={currentDM?.content || ""}
        browserStatus={browserStatus}
        onConfirm={handleConfirmDM}
        onCancel={handleCancelDM}
        onEdit={() => {}}
      />
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
