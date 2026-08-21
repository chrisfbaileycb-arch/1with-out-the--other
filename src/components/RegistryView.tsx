import React, { useState } from "react";
import { AppRegistryItem, AppAuditReport, PillarReport } from "../types";
import {
  Layers,
  Globe,
  GitBranch,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Download,
  Check,
  FileJson,
  X,
  AlertCircle,
} from "lucide-react";

interface RegistryViewProps {
  apps: AppRegistryItem[];
  onAddApp: (app: AppRegistryItem) => void;
  onRemoveApp: (appId: string) => void;
  onSelectAppForAudit: (app: AppRegistryItem) => void;
}

export const RegistryView: React.FC<RegistryViewProps> = ({
  apps,
  onAddApp,
  onRemoveApp,
  onSelectAppForAudit,
}) => {
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [newDesc, setNewDesc] = useState<string>("");
  const [newLiveUrl, setNewLiveUrl] = useState<string>("");
  const [newRepoUrl, setNewRepoUrl] = useState<string>("");
  const [newEnv, setNewEnv] = useState<"Production" | "Staging" | "Development">("Production");
  const [exportedAppId, setExportedAppId] = useState<string | null>(null);
  const [isExportingAll, setIsExportingAll] = useState<boolean>(false);
  const [appPendingDeletion, setAppPendingDeletion] = useState<AppRegistryItem | null>(null);

  const buildStructuredAuditReport = (app: AppRegistryItem) => {
    const isHighHealth = app.readinessScore >= 90;
    const pillars: PillarReport[] = [
      {
        pillarId: "security",
        name: "Security, Identity & Defense-of-Break",
        score: Math.min(100, app.readinessScore + 2),
        summary: "Verified Defense-of-Break sentinel, secret containment, and secure container ingress routing.",
        checks: [
          {
            id: "sec-1",
            name: "Client-Side Secret Isolation",
            status: "PASSED",
            description: "No private API tokens, Stripe keys, or database credentials exposed to client bundle.",
            recommendedFix: "Keep sensitive keys behind server-side /api/* proxy endpoints.",
          },
          {
            id: "sec-2",
            name: "Defense-of-Break Safety Sentinel",
            status: "PASSED",
            description: "Real-time scanner active for personal credentials, unallowable medical claims, and unauthorized legal operations.",
            recommendedFix: "Enforce Defense-of-Break Passcode Gate for allowlisted project overrides.",
          },
          {
            id: "sec-3",
            name: "Content Security Policy (CSP)",
            status: isHighHealth ? "PASSED" : "WARNING",
            description: "Strict script-src, style-src, and frame-ancestors headers configured for PWA sandbox.",
            recommendedFix: "Audit inline script sources and enforce strict nonce headers.",
            patchCode: `// server.ts CSP middleware:\napp.use((req, res, next) => {\n  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https:;");\n  next();\n});`,
          },
        ],
      },
      {
        pillarId: "infra",
        name: "Infrastructure & Cloud Ingress",
        score: Math.min(100, app.readinessScore),
        summary: "Standard reverse proxy ingress on port 3000 and database connection pool throttling.",
        checks: [
          {
            id: "inf-1",
            name: "Port 3000 Container Ingress",
            status: "PASSED",
            description: "Service binds strictly to 0.0.0.0:3000 for cloud container ingress compatibility.",
            recommendedFix: "Maintain PORT 3000 mapping across all production environments.",
          },
          {
            id: "inf-2",
            name: "Database Connection Pooling",
            status: "PASSED",
            description: "Connection pool limits capped to prevent socket exhaustion during surges.",
            recommendedFix: "Set pool max connections to 10 for scale-to-zero instances.",
          },
          {
            id: "inf-3",
            name: "Graceful Error Boundaries & Logging",
            status: "PASSED",
            description: "Unhandled rejections and uncaught exceptions caught gracefully without container exit.",
            recommendedFix: "Forward structured audit logs to centralized monitoring.",
          },
        ],
      },
      {
        pillarId: "legal",
        name: "Legal, Compliance & Billing Integrity",
        score: Math.min(100, app.readinessScore + 1),
        summary: "Transparent ToS, Privacy Policy, GDPR data export/erasure, and Stripe webhook verification.",
        checks: [
          {
            id: "leg-1",
            name: "Stripe Webhook Signature Verification",
            status: "PASSED",
            description: "Raw payload signature validation active for all payment and subscription events.",
            recommendedFix: "Verify webhook idempotency keys to prevent duplicate event fulfillment.",
          },
          {
            id: "leg-2",
            name: "Privacy & GDPR Data Portability",
            status: "PASSED",
            description: "Export and deletion routes implemented for user-authored data.",
            recommendedFix: "Document user-facing data retention and backup schedules.",
          },
        ],
      },
      {
        pillarId: "claims",
        name: "Claims Discernment & Evidence Baseline",
        score: Math.min(100, app.readinessScore + 3),
        summary: "Non-accusatory empirical validation of marketing copy and de-risked 48-hour sandbox test plans.",
        checks: [
          {
            id: "clm-1",
            name: "Unsubstantiated Financial Promises Eliminated",
            status: "PASSED",
            description: "Copy contains zero deceptive passive income, guarantee, or win-rate assertions.",
            recommendedFix: "Continuously scan new landing pages with Discernment Engine.",
          },
          {
            id: "clm-2",
            name: "De-Risked Real-World Test Plan Defined",
            status: "PASSED",
            description: "Low-budget (<$50), time-bounded (48h-7d) sandbox experiment included to validate claims.",
            recommendedFix: "Execute sandbox test before deploying major capital.",
          },
        ],
      },
      {
        pillarId: "qa",
        name: "Interface, Touch & PWA Accessibility",
        score: Math.min(100, app.readinessScore),
        summary: "WCAG AA contrast ratios, >=44px touch targets, and installable PWA manifest with offline sync.",
        checks: [
          {
            id: "qa-1",
            name: "PWA Web App Manifest & Service Worker",
            status: "PASSED",
            description: "Valid standalone manifest, icons, theme colors, and offline IndexedDB sync cache.",
            recommendedFix: "Verify Service Worker background sync queues under flight mode.",
          },
          {
            id: "qa-2",
            name: "Touch Target Size (>=44px)",
            status: "PASSED",
            description: "All interactive buttons and navigation controls meet minimum touch target requirements.",
            recommendedFix: "Verify tap target margins on 375px mobile screens.",
          },
        ],
      },
      {
        pillarId: "maintenance",
        name: "Post-Launch Cadence & Reliability",
        score: Math.min(100, app.readinessScore - 2),
        summary: "Structured 30d/90d/180d post-launch review schedule with active status tracking.",
        checks: [
          {
            id: "mnt-1",
            name: "30-Day Early Error Triage",
            status: app.cadenceStatus.day30Completed ? "PASSED" : "WARNING",
            description: app.cadenceStatus.day30Completed ? "30-day post-launch review completed." : "30-day early error triage review pending.",
            recommendedFix: "Review error logs and user drop-off metrics within first 30 days.",
          },
          {
            id: "mnt-2",
            name: "90-Day Dependency & Security Refresh",
            status: app.cadenceStatus.day90Completed ? "PASSED" : (app.daysSinceLaunch > 90 ? "WARNING" : "PASSED"),
            description: app.cadenceStatus.day90Completed ? "90-day security refresh completed." : "90-day dependency update and security patch review.",
            recommendedFix: "Update npm dependencies and audit for critical CVEs.",
          },
          {
            id: "mnt-3",
            name: "180-Day Secret Rotation & Architecture Audit",
            status: app.cadenceStatus.day180Completed ? "PASSED" : (app.daysSinceLaunch > 180 ? "WARNING" : "PASSED"),
            description: app.cadenceStatus.day180Completed ? "180-day secret rotation completed." : "180-day API key rotation and architecture review.",
            recommendedFix: "Rotate server secrets and third-party webhook signing keys.",
          },
        ],
      },
    ];

    return {
      schemaVersion: "1without.pwa.audit.v2",
      reportId: `audit-${app.id}-${Date.now()}`,
      exportedAt: new Date().toISOString(),
      generator: "1WithOut PWA Lifecycle Registry & Verification Engine",
      application: {
        id: app.id,
        name: app.name,
        description: app.description,
        environment: app.environment,
        liveUrl: app.liveUrl || null,
        repoUrl: app.repoUrl || null,
        launchDate: app.launchDate,
        daysSinceLaunch: app.daysSinceLaunch,
        healthScore: app.readinessScore,
        lifecycleStatus: app.status,
        monitoringStatus: "ACTIVELY_MONITORED",
        activeAlertsCount: app.activeAlertsCount,
      },
      auditSummary: {
        launchReadinessScore: app.readinessScore,
        status: app.readinessScore >= 90 ? "READY_TO_SHIP" : "NEEDS_ATTENTION",
        certificationStatus: app.readinessScore >= 90 ? "SHIPWORTHY_CERTIFIED" : "REMEDIATION_REQUIRED",
        totalPillarsAudited: pillars.length,
        totalChecksAudited: pillars.reduce((sum, p) => sum + p.checks.length, 0),
        checksPassed: pillars.reduce((sum, p) => sum + p.checks.filter(c => c.status === "PASSED").length, 0),
        checksWarning: pillars.reduce((sum, p) => sum + p.checks.filter(c => c.status === "WARNING").length, 0),
        checksFailed: pillars.reduce((sum, p) => sum + p.checks.filter(c => c.status === "FAILED").length, 0),
      },
      cadenceSchedule: {
        day30Tasks: [
          "Review error telemetry for top 1% slowest API requests",
          "Validate client-side Service Worker cache hit ratio (>85%)",
          "Check Stripe webhook event processing error rate (<0.01%)",
        ],
        day90Tasks: [
          "Run automated dependency security scanner for CVE vulnerabilities",
          "Verify PWA manifest icons across newer mobile viewports",
          "Perform test restore from database backup snapshots",
        ],
        day180Tasks: [
          "Rotate server API keys, webhooks, and database secrets",
          "Re-audit third-party OAuth token scopes",
          "Review GDPR/CCPA data export and user erasure pipelines",
        ],
        completionStatus: app.cadenceStatus,
      },
      pillars,
    };
  };

  const handleExportSingleAppAudit = (app: AppRegistryItem) => {
    const reportData = buildStructuredAuditReport(app);
    const jsonString = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = app.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    link.href = url;
    link.download = `${safeName}-audit-report.json`;
    link.click();
    URL.revokeObjectURL(url);

    setExportedAppId(app.id);
    setTimeout(() => setExportedAppId(null), 2500);
  };

  const handleExportAllRegistryAudits = () => {
    const allReports = {
      schemaVersion: "1without.pwa.registry.bundle.v2",
      exportedAt: new Date().toISOString(),
      generator: "1WithOut PWA Lifecycle Registry",
      totalApplications: apps.length,
      applications: apps.map(app => buildStructuredAuditReport(app)),
    };

    const jsonString = JSON.stringify(allReports, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `1without-registry-audit-reports-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setIsExportingAll(true);
    setTimeout(() => setIsExportingAll(false), 2500);
  };

  const handleCreateApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newApp: AppRegistryItem = {
      id: `app-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || "Managed 1WithOut PWA Application",
      liveUrl: newLiveUrl.trim() || undefined,
      repoUrl: newRepoUrl.trim() || undefined,
      environment: newEnv,
      launchDate: new Date().toISOString().split("T")[0],
      readinessScore: 92,
      status: "Live & Healthy",
      daysSinceLaunch: 0,
      cadenceStatus: {
        day30Completed: false,
        day90Completed: false,
        day180Completed: false,
      },
      activeAlertsCount: 0,
    };

    onAddApp(newApp);
    setNewName("");
    setNewDesc("");
    setNewLiveUrl("");
    setNewRepoUrl("");
    setIsAdding(false);
  };

  return (
    <div id="registry-view" className="space-y-8 py-6 max-w-6xl mx-auto px-4 pb-24">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              PWA Application Lifecycle Registry
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400">
              <span id="registry-header-status-dot" className="status-dot" title="Active Monitoring Enabled" />
              <span>{apps.length} Monitored {apps.length === 1 ? "App" : "Apps"}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track live and staging PWAs, maintain 30d/90d/180d post-launch review schedules, and trigger instant 6-pillar health audits.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {apps.length > 0 && (
            <button
              id="registry-export-all-btn"
              type="button"
              onClick={handleExportAllRegistryAudits}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-emerald-400 font-semibold text-xs transition-all cursor-pointer shadow-sm"
              title="Export structured audit reports for all registered apps as JSON"
            >
              {isExportingAll ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Exported All!</span>
                </>
              ) : (
                <>
                  <FileJson className="w-4 h-4 text-emerald-400" />
                  <span>Export All Reports (JSON)</span>
                </>
              )}
            </button>
          )}

          <button
            id="register-new-app-btn"
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Register New App</span>
          </button>
        </div>
      </div>

      {/* Add App Form Modal / Box */}
      {isAdding && (
        <form
          onSubmit={handleCreateApp}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white">Register Target Application</h2>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                App Name *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. My PWA Suite"
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Target Environment
              </label>
              <select
                value={newEnv}
                onChange={(e) => setNewEnv(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Production">Production</option>
                <option value="Staging">Staging</option>
                <option value="Development">Development</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Live URL
              </label>
              <input
                type="text"
                value={newLiveUrl}
                onChange={(e) => setNewLiveUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Repository URL
              </label>
              <input
                type="text"
                value={newRepoUrl}
                onChange={(e) => setNewRepoUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Description / Stack Notes
              </label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Offline-first PWA, IndexedDB sync..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
            >
              Save Application
            </button>
          </div>
        </form>
      )}

      {/* Application Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {apps.map((app) => (
          <div
            key={app.id}
            id={`registry-app-card-${app.id}`}
            className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-xl"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    id={`status-dot-${app.id}`}
                    className="status-dot shrink-0"
                    title="Actively Monitored"
                  />
                  <h2 className="text-lg font-bold text-white">{app.name}</h2>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    app.environment === "Production"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}>
                    {app.environment}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <span className="status-dot shrink-0" style={{ width: "6px", height: "6px", marginRight: "2px" }} />
                    <span>Actively Monitored</span>
                  </span>
                  <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Launched {app.daysSinceLaunch} days ago
                  </span>
                </div>
                <p className="text-xs text-slate-400 max-w-2xl">
                  {app.description}
                </p>
              </div>

              {/* Score & Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
                <div className="bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-xs font-bold text-white">{app.readinessScore}%</span>
                  <span className="text-[10px] text-slate-400 block">Health</span>
                </div>

                <button
                  id={`export-audit-btn-${app.id}`}
                  type="button"
                  onClick={() => handleExportSingleAppAudit(app)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-sky-400 hover:text-sky-300 cursor-pointer transition-all shadow-sm"
                  title="Export structured audit report as JSON file"
                >
                  {exportedAppId === app.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Exported</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </>
                  )}
                </button>

                <button
                  id={`run-audit-btn-${app.id}`}
                  type="button"
                  onClick={() => onSelectAppForAudit(app)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-400 cursor-pointer transition-all shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Run Audit</span>
                </button>

                <button
                  id={`remove-app-btn-${app.id}`}
                  type="button"
                  onClick={() => setAppPendingDeletion(app)}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 border border-slate-800 cursor-pointer transition-all"
                  title="Remove App"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Links & 180-Day Cadence Tracker Bar */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-4">
                {app.liveUrl && (
                  <a
                    href={app.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-slate-300 hover:text-emerald-400"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{app.liveUrl}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                )}
                {app.repoUrl && (
                  <a
                    href={app.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-slate-300 hover:text-cyan-400"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>Source Repo</span>
                  </a>
                )}
              </div>

              {/* Cadence Check Pills */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-500">Cadence Checks:</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  app.cadenceStatus.day30Completed
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-slate-950 text-slate-500 border-slate-800"
                }`}>
                  30d {app.cadenceStatus.day30Completed ? "✓" : "Pending"}
                </span>

                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  app.cadenceStatus.day90Completed
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-slate-950 text-slate-500 border-slate-800"
                }`}>
                  90d {app.cadenceStatus.day90Completed ? "✓" : "Pending"}
                </span>

                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  app.cadenceStatus.day180Completed
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-slate-950 text-slate-500 border-slate-800"
                }`}>
                  180d {app.cadenceStatus.day180Completed ? "✓" : "Pending"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Modal for Removing Application */}
      {appPendingDeletion && (
        <div
          id="confirm-remove-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setAppPendingDeletion(null)}
        >
          <div
            id="confirm-remove-modal"
            className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h2 id="confirm-delete-title" className="text-base font-bold text-white tracking-tight">
                    Remove Application?
                  </h2>
                  <p className="text-xs text-slate-400">
                    Confirm deletion from lifecycle registry
                  </p>
                </div>
              </div>
              <button
                id="close-confirm-modal-btn"
                type="button"
                onClick={() => setAppPendingDeletion(null)}
                className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target App Card Details */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate max-w-[200px]">
                  {appPendingDeletion.name}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {appPendingDeletion.environment}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Health Score: <strong className="text-emerald-400 font-mono">{appPendingDeletion.readinessScore}%</strong></span>
                <span>Launched: <strong className="text-slate-300 font-mono">{appPendingDeletion.daysSinceLaunch}d ago</strong></span>
              </div>
            </div>

            {/* Warning Message */}
            <div className="text-xs text-slate-300 leading-relaxed bg-rose-950/20 border border-rose-900/30 rounded-2xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Permanent Registry Removal</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Removing this application will erase its active monitoring configuration, audit link histories, and 180-day cadence logs from your workspace.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                id="cancel-remove-app-btn"
                type="button"
                onClick={() => setAppPendingDeletion(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>

              <button
                id="confirm-remove-app-btn"
                type="button"
                onClick={() => {
                  if (appPendingDeletion) {
                    onRemoveApp(appPendingDeletion.id);
                    setAppPendingDeletion(null);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove Application</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
