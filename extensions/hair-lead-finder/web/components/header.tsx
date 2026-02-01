"use client";

import { motion } from "framer-motion";
import { Search, Settings, Bell, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center"
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Lead Finder
            </h1>
            <p className="text-[10px] text-muted-foreground -mt-0.5">
              AI-Powered Instagram Outreach
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="#"
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Dashboard
          </a>
          <a
            href="#"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Campaigns
          </a>
          <a
            href="#"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Analytics
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Bell className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Settings className="w-4 h-4" />
          </Button>
          <Avatar className="w-8 h-8 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
            <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
