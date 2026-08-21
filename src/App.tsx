import React, { useState, useEffect } from "react";
import { TabType, AppRegistryItem, SecurityClearance } from "./types";
import { INITIAL_REGISTRY_APPS, SAMPLE_SCENARIOS } from "./data/samples";
import { Navbar } from "./components/Navbar";
import { OverviewView } from "./components/OverviewView";
import { DiscernView } from "./components/DiscernView";
import { SkillBuilderView } from "./components/SkillBuilderView";
import { PreFlightAuditView } from "./components/PreFlightAuditView";
import { RegistryView } from "./components/RegistryView";
import { DefenseGateView } from "./components/DefenseGateView";
import { ShipworthyRunnerView } from "./components/ShipworthyRunnerView";
import { ModalCheckout } from "./components/ModalCheckout";

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>("shipworthy");
  const [currentTier, setCurrentTier] = useState<string>("free");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  // Security Clearance for Defense-of-Break Gate (Passcode access)
  const [securityClearance, setSecurityClearance] = useState<SecurityClearance | null>(null);

  // Cross-component state transfers
  const [discernInitialContent, setDiscernInitialContent] = useState<string>("");
  const [discernInitialSourceType, setDiscernInitialSourceType] = useState<any>("text");
  const [discernInitialSourceUrl, setDiscernInitialSourceUrl] = useState<string>("");

  const [skillInitialContent, setSkillInitialContent] = useState<string>("");
  const [skillInitialName, setSkillInitialName] = useState<string>("");

  // Pre-Flight Audit initial state for cross-component triggers
  const [auditInitialAppName, setAuditInitialAppName] = useState<string>("1WithOut Master PWA Engine");
  const [auditInitialLiveUrl, setAuditInitialLiveUrl] = useState<string>("https://1without.io");
  const [auditInitialRepoUrl, setAuditInitialRepoUrl] = useState<string>("https://github.com/1without/master-engine");
  const [auditInitialStackDesc, setAuditInitialStackDesc] = useState<string>(
    "React PWA with Vite, Tailwind CSS, Express TypeScript server, Port 3000 Ingress, Gemini 3.7 Flash server-side integration, Stripe Checkout, and Defense-of-Break sentinel."
  );

  // App Lifecycle Registry state
  const [registryApps, setRegistryApps] = useState<AppRegistryItem[]>(() => {
    const saved = localStorage.getItem("1without_apps_registry");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return INITIAL_REGISTRY_APPS;
  });

  useEffect(() => {
    localStorage.setItem("1without_apps_registry", JSON.stringify(registryApps));
  }, [registryApps]);

  const handleSelectSample = (sampleId: string) => {
    const sample = SAMPLE_SCENARIOS.find((s) => s.id === sampleId);
    if (!sample) return;

    if (sample.suggestedMode === "build_skill") {
      setSkillInitialContent(sample.fullContent);
      setSkillInitialName(sample.title);
      setActiveTab("skills");
    } else {
      setDiscernInitialContent(sample.fullContent);
      setDiscernInitialSourceType(sample.sourceType);
      setDiscernInitialSourceUrl(sample.sourceUrl || "");
      setActiveTab("discern");
    }
  };

  const handleSendToSkillBuilder = (text: string, title: string) => {
    setSkillInitialContent(text);
    setSkillInitialName(`Executable Skill: ${title.replace(/^Audit:\s*|^Remediation Directives:\s*/i, "")}`);
    setActiveTab("skills");
  };

  const handleAddApp = (app: AppRegistryItem) => {
    setRegistryApps((prev) => [app, ...prev]);
  };

  const handleRemoveApp = (appId: string) => {
    setRegistryApps((prev) => prev.filter((a) => a.id !== appId));
  };

  const handleSelectAppForAudit = (app: AppRegistryItem) => {
    setAuditInitialAppName(app.name);
    if (app.liveUrl) setAuditInitialLiveUrl(app.liveUrl);
    if (app.repoUrl) setAuditInitialRepoUrl(app.repoUrl);
    if (app.description) setAuditInitialStackDesc(app.description);
    setActiveTab("audit");
  };

  return (
    <div id="1without-root-app" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpgradeModal={() => setIsCheckoutOpen(true)}
        currentTier={currentTier}
        securityClearance={securityClearance}
        onOpenDefenseGate={() => setActiveTab("defense")}
      />

      {/* Main Content View Switcher */}
      <main id="main-content-view" className="flex-1">
        {activeTab === "shipworthy" && (
          <ShipworthyRunnerView
            onSendToSkillBuilder={handleSendToSkillBuilder}
            onNavigateToAudit={(name, live, repo) => {
              setAuditInitialAppName(name);
              setAuditInitialLiveUrl(live);
              setAuditInitialRepoUrl(repo);
              setActiveTab("audit");
            }}
          />
        )}

        {activeTab === "overview" && (
          <OverviewView
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectSample={handleSelectSample}
            onSelectTier={(tierId) => {
              setCurrentTier(tierId);
              setIsCheckoutOpen(true);
            }}
            securityClearance={securityClearance}
          />
        )}

        {activeTab === "discern" && (
          <DiscernView
            initialContent={discernInitialContent}
            initialSourceType={discernInitialSourceType}
            initialSourceUrl={discernInitialSourceUrl}
            onSendToSkillBuilder={handleSendToSkillBuilder}
            securityClearance={securityClearance}
            onOpenDefenseModal={() => setActiveTab("defense")}
          />
        )}

        {activeTab === "skills" && (
          <SkillBuilderView
            initialContent={skillInitialContent}
            initialSkillName={skillInitialName}
            securityClearance={securityClearance}
            onOpenDefenseModal={() => setActiveTab("defense")}
          />
        )}

        {activeTab === "audit" && (
          <PreFlightAuditView
            initialAppName={auditInitialAppName}
            initialLiveUrl={auditInitialLiveUrl}
            initialRepoUrl={auditInitialRepoUrl}
            initialStackDesc={auditInitialStackDesc}
            onSendToSkillBuilder={handleSendToSkillBuilder}
            onSaveToRegistry={(audit) => {
              const newApp: AppRegistryItem = {
                id: `app-${Date.now()}`,
                name: audit.appName,
                description: audit.stackDescription || "Audited PWA Application",
                liveUrl: audit.liveUrl,
                repoUrl: audit.repoUrl,
                environment: "Production",
                launchDate: new Date().toISOString().split("T")[0],
                readinessScore: audit.launchReadinessScore,
                status: audit.launchReadinessScore >= 90 ? "Live & Healthy" : "Pre-Flight Pending",
                daysSinceLaunch: 0,
                cadenceStatus: {
                  day30Completed: false,
                  day90Completed: false,
                  day180Completed: false,
                },
                lastAuditId: audit.id,
                activeAlertsCount: audit.launchReadinessScore < 90 ? 1 : 0,
              };
              handleAddApp(newApp);
              setActiveTab("registry");
            }}
          />
        )}

        {activeTab === "registry" && (
          <RegistryView
            apps={registryApps}
            onAddApp={handleAddApp}
            onRemoveApp={handleRemoveApp}
            onSelectAppForAudit={handleSelectAppForAudit}
          />
        )}

        {activeTab === "defense" && (
          <DefenseGateView
            securityClearance={securityClearance}
            onClearanceUpdated={(clearance) => setSecurityClearance(clearance)}
          />
        )}
      </main>

      {/* Global Commercial Checkout / Upgrade Modal */}
      <ModalCheckout
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        currentTier={currentTier}
        onSelectTier={(tierId) => setCurrentTier(tierId)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">1WithOut Engine</span>
            <span>•</span>
            <span>Single Source of Truth Repository</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Defense-of-Break Sentinel Active</span>
            <span>•</span>
            <span>6-Pillar PWA Launch Matrix</span>
            <span>•</span>
            <span>Axe-Core™ A11y & ARIA Engine</span>
            <span>•</span>
            <span>Gemini 3.7 Flash Backend</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
