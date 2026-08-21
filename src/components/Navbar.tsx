import React from "react";
import { TabType, SecurityClearance } from "../types";
import {
  Compass,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Flame,
  Lock,
  Unlock,
  ShieldAlert,
  Zap,
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
      className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/90 border-b border-slate-800 text-slate-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            id="brand-logo-container"
            onClick={() => setActiveTab("overview")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  1WithOut
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  PWA Lifecycle Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Knowledge-to-Execution & 5-10 Step Skill Matrix
              </p>
            </div>
          </div>

          {/* Center Nav Tabs */}
          <nav id="main-navigation-tabs" className="hidden lg:flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
            <button
              id="nav-tab-shipworthy"
              onClick={() => setActiveTab("shipworthy")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "shipworthy"
                  ? "bg-slate-800 text-emerald-400 shadow-sm border border-slate-700"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Shipworthy QA</span>
            </button>

            <button
              id="nav-tab-overview"
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "overview"
                  ? "bg-slate-800 text-emerald-400 shadow-sm border border-slate-700"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              id="nav-tab-discern"
              onClick={() => setActiveTab("discern")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "discern"
                  ? "bg-slate-800 text-emerald-400 shadow-sm border border-slate-700"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Claims Discernment</span>
            </button>

            <button
              id="nav-tab-skills"
              onClick={() => setActiveTab("skills")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "skills"
                  ? "bg-slate-800 text-emerald-400 shadow-sm border border-slate-700"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Agent Skill Builder</span>
            </button>

            <button
              id="nav-tab-audit"
              onClick={() => setActiveTab("audit")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "audit"
                  ? "bg-slate-800 text-emerald-400 shadow-sm border border-slate-700"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>6-Pillar Matrix</span>
            </button>

            <button
              id="nav-tab-registry"
              onClick={() => setActiveTab("registry")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "registry"
                  ? "bg-slate-800 text-emerald-400 shadow-sm border border-slate-700"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>App Lifecycle</span>
            </button>

            <button
              id="nav-tab-defense"
              onClick={() => setActiveTab("defense")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "defense"
                  ? "bg-slate-800 text-rose-400 shadow-sm border border-slate-700"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Defense Sentinel</span>
            </button>
          </nav>

          {/* Right Action buttons & Defense Status Badge */}
          <div className="flex items-center gap-2.5">
            {/* Defense of break status indicator */}
            <button
              id="defense-status-pill-btn"
              type="button"
              onClick={openDefense}
              title="Defense-of-Break Protection Status"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                securityClearance?.isCleared
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                  : "bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20"
              }`}
            >
              {securityClearance?.isCleared ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Passkey Cleared</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Defense Active</span>
                </>
              )}
            </button>

            <button
              id="header-tier-badge-btn"
              onClick={onOpenUpgradeModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="capitalize">{currentTier} Plan</span>
            </button>

            <button
              id="header-quick-launch-scan-btn"
              onClick={() => setActiveTab("audit")}
              className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Launch Matrix</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex lg:hidden items-center justify-between gap-1 py-2 overflow-x-auto border-t border-slate-800/80 scrollbar-none">
          <button
            onClick={() => setActiveTab("shipworthy")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === "shipworthy" ? "bg-slate-800 text-emerald-400 font-bold" : "text-slate-400"
            }`}
          >
            Shipworthy
          </button>
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === "overview" ? "bg-slate-800 text-emerald-400" : "text-slate-400"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("discern")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === "discern" ? "bg-slate-800 text-emerald-400" : "text-slate-400"
            }`}
          >
            Claims
          </button>
          <button
            onClick={() => setActiveTab("skills")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === "skills" ? "bg-slate-800 text-emerald-400" : "text-slate-400"
            }`}
          >
            Skill Builder
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === "audit" ? "bg-slate-800 text-emerald-400" : "text-slate-400"
            }`}
          >
            6-Pillar Matrix
          </button>
          <button
            onClick={() => setActiveTab("registry")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === "registry" ? "bg-slate-800 text-emerald-400" : "text-slate-400"
            }`}
          >
            Lifecycle
          </button>
          <button
            onClick={() => setActiveTab("defense")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === "defense" ? "bg-slate-800 text-rose-400" : "text-slate-400"
            }`}
          >
            Defense Gate
          </button>
        </div>
      </div>
    </header>
  );
};
