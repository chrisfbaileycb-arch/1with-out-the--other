import React from "react";
import { TabType, SecurityClearance } from "../types";
import {
  Zap,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Store,
  Bot,
  Boxes,
  Home,
  ArrowRight,
} from "lucide-react";

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenUpgradeModal: () => void;
  currentTier: string;
  securityClearance?: SecurityClearance | null;
  onOpenDefenseModal?: () => void;
  onOpenDefenseGate?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpgradeModal,
  currentTier,
  securityClearance,
  onOpenDefenseModal,
  onOpenDefenseGate,
}) => {
  const openDefense = onOpenDefenseGate || onOpenDefenseModal || (() => setActiveTab("defense"));

  return (
    <header
      id="1without-header"
      className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-slate-200/90 text-slate-900 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            id="brand-logo-container"
            onClick={() => setActiveTab("cover")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-700 p-0.5 shadow-sm group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  OPC Launchpad
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  1WithOut OS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Digital Commerce • Domain Matrix • Nova Copilot
              </p>
            </div>
          </div>

          {/* Center Nav Tabs */}
          <nav id="main-navigation-tabs" className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            <button
              id="nav-tab-cover"
              onClick={() => setActiveTab("cover")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "cover"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              id="nav-tab-launchpad"
              onClick={() => setActiveTab("launchpad")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "launchpad"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-700" />
              <span>Domain Studio</span>
            </button>

            <button
              id="nav-tab-storefront"
              onClick={() => setActiveTab("storefront")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "storefront"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Store className="w-3.5 h-3.5 text-teal-700" />
              <span>Storefront</span>
            </button>

            <button
              id="nav-tab-backoffice"
              onClick={() => setActiveTab("backoffice")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "backoffice"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Boxes className="w-3.5 h-3.5 text-slate-700" />
              <span>Back-Office</span>
            </button>

            <button
              id="nav-tab-agent-workspace"
              onClick={() => setActiveTab("agent_workspace")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "agent_workspace"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-cyan-700" />
              <span>Nova Copilot</span>
            </button>

            <button
              id="nav-tab-audit"
              onClick={() => setActiveTab("audit")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "audit" || activeTab === "shipworthy"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>6-Pillar QA</span>
            </button>

            <button
              id="nav-tab-defense"
              onClick={() => openDefense()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "defense"
                  ? "bg-white text-rose-800 shadow-xs border border-slate-200/80 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Defense Gate</span>
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2.5">
            {/* Defense status indicator */}
            <button
              id="defense-status-pill-btn"
              type="button"
              onClick={openDefense}
              title="Defense-of-Break Protection Status"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                securityClearance?.isCleared
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                  : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
              }`}
            >
              {securityClearance?.isCleared ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Passkey Cleared</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  <span>Defense Active</span>
                </>
              )}
            </button>

            {/* Launch Console CTA */}
            <button
              id="header-launch-console-btn"
              type="button"
              onClick={() => setActiveTab("launchpad")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Launch Console</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex lg:hidden items-center justify-between gap-1 py-2 overflow-x-auto border-t border-slate-200 scrollbar-none">
          <button
            onClick={() => setActiveTab("cover")}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === "cover" ? "bg-emerald-50 text-emerald-800 font-bold" : "text-slate-600"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("launchpad")}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === "launchpad" ? "bg-emerald-50 text-emerald-800 font-bold" : "text-slate-600"
            }`}
          >
            Studio
          </button>
          <button
            onClick={() => setActiveTab("storefront")}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === "storefront" ? "bg-emerald-50 text-emerald-800 font-bold" : "text-slate-600"
            }`}
          >
            Storefront
          </button>
          <button
            onClick={() => setActiveTab("backoffice")}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === "backoffice" ? "bg-emerald-50 text-emerald-800 font-bold" : "text-slate-600"
            }`}
          >
            Back-Office
          </button>
          <button
            onClick={() => setActiveTab("agent_workspace")}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === "agent_workspace" ? "bg-emerald-50 text-emerald-800 font-bold" : "text-slate-600"
            }`}
          >
            Nova Copilot
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === "audit" ? "bg-emerald-50 text-emerald-800 font-bold" : "text-slate-600"
            }`}
          >
            6-Pillar QA
          </button>
        </div>
      </div>
    </header>
  );
};
