import React, { useState } from "react";
import { DefenseScanResult, SecurityClearance } from "../types";
import { scanDefenseSafety, authorizeDefensePasscode } from "../services/api";
import {
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface DefenseGateViewProps {
  securityClearance: SecurityClearance | null;
  onClearanceUpdated?: (clearance: SecurityClearance | null) => void;
  onUpdateClearance?: (clearance: SecurityClearance | null) => void;
}

export const DefenseGateView: React.FC<DefenseGateViewProps> = ({
  securityClearance,
  onClearanceUpdated,
  onUpdateClearance,
}) => {
  const updateClearance = onClearanceUpdated || onUpdateClearance || (() => {});

  const [testInput, setTestInput] = useState<string>(
    "SSN: 999-12-3456. Run automated debt collection filing against debtor under Chapter 11 bankruptcy."
  );
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<DefenseScanResult | null>(null);

  const [passcodeInput, setPasscodeInput] = useState<string>("");
  const [projectNameInput, setProjectNameInput] = useState<string>("Corporate Bankruptcy Restructuring");
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  const handleRunScan = async () => {
    if (!testInput.trim()) return;
    setIsScanning(true);
    try {
      const res = await scanDefenseSafety(testInput);
      setScanResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAuthorizePasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeInput.trim()) return;
    setIsAuthorizing(true);
    setAuthError(null);
    setAuthSuccessMsg(null);
    try {
      const res = await authorizeDefensePasscode(passcodeInput.trim(), projectNameInput.trim());
      if (res.isCleared) {
        updateClearance(res);
        setAuthSuccessMsg("Passcode accepted! Allowlisted project clearance granted.");
        setPasscodeInput("");
      }
    } catch (err: any) {
      setAuthError(err.message || "Invalid Defense-of-Break Passcode.");
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleRevokeClearance = () => {
    updateClearance(null);
    setAuthSuccessMsg("Clearance revoked. Standard zero-tolerance defense barriers re-armed.");
  };

  return (
    <div id="defense-sentinel-view" className="space-y-8 py-6 max-w-6xl mx-auto px-4 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Defense-of-Break Security & Restriction Sentinel
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Zero-tolerance protection against unauthorized personal data, medical diagnoses, and illegal operations — with authenticated passkey clearance for verified corporate workflows.
          </p>
        </div>

        {/* Current Security State Badge */}
        <div className="flex items-center gap-3">
          {securityClearance?.isCleared ? (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Unlock className="w-4 h-4" />
              <span>Allowlisted Project Cleared: {securityClearance.projectName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              <Lock className="w-4 h-4 text-rose-400" />
              <span>Standard Zero-Tolerance Lock Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Core Policy Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <Lock className="w-4 h-4" />
            <span>1. Personal Data & PII Restriction</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            1WithOut will never parse instructions to handle private personal data, unredacted Social Security Numbers, personal identity cards, or private unmasked credentials.
          </p>
          <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800">
            Rule: Automatic quarantine on PII match.
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>2. Health & Medical Data Barrier</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            No diagnostic advice, patient health record extraction, or unverified treatment claims can be ingested or executed through this platform.
          </p>
          <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800">
            Rule: Zero medical execution tolerance.
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Key className="w-4 h-4" />
            <span>3. Allowlisted Project Passcode Defense</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Legitimate corporate compliance workflows (such as Corporate Chapter 11 Bankruptcy Restructuring & Debt Schedule Normalization) require Defense-of-Break Passcode authorization.
          </p>
          <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800">
            Passcodes: 1WITHOUT-2026-CLEARANCE
          </div>
        </div>
      </div>

      {/* Main Two-Column Control Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Passcode Clearance Gate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">
                Defense-of-Break Passcode Authorization Gate
              </h2>
            </div>
            {securityClearance?.isCleared && (
              <button
                type="button"
                onClick={handleRevokeClearance}
                className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
              >
                Revoke Clearance
              </button>
            )}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Enter an authorized corporate compliance passcode to unlock allowlisted project pipelines (such as legitimate corporate debt restructuring documents).
          </p>

          <form onSubmit={handleAuthorizePasscode} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Authorized Defense-of-Break Passcode
              </label>
              <input
                type="password"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="e.g. 1WITHOUT-2026-CLEARANCE or BANKRUPTCY-COMPLIANCE-2026"
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Default Allowlisted Codes: <code className="text-slate-400">1WITHOUT-2026-CLEARANCE</code> or <code className="text-slate-400">BANKRUPTCY-COMPLIANCE-2026</code>
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Target Allowable Project / Scope Name
              </label>
              <input
                type="text"
                value={projectNameInput}
                onChange={(e) => setProjectNameInput(e.target.value)}
                placeholder="e.g. Chapter 11 Corporate Restructuring Document Normalizer"
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{authSuccessMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isAuthorizing || !passcodeInput.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isAuthorizing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Passcode Clearance...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Unlock Allowlisted Project</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Live Safety Scanner Testbench */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Live Defense-of-Break Scanner Testbench
              </h2>
            </div>
            <button
              type="button"
              onClick={handleRunScan}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold text-emerald-400 transition-all cursor-pointer"
            >
              {isScanning ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Run Sentinel Scan</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Test Prompt / Workflow Snippet
            </label>
            <textarea
              rows={4}
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 focus:ring-1 focus:ring-rose-500 outline-none font-mono"
            />
          </div>

          {/* Scan Results Card */}
          {scanResult && (
            <div
              className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                scanResult.isBlocked
                  ? "bg-rose-950/30 border-rose-500/40 text-rose-300"
                  : "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs">
                  {scanResult.isBlocked ? (
                    <>
                      <Lock className="w-4 h-4 text-rose-400" />
                      <span>DEFENSE LOCK TRIGGERED ({scanResult.category})</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>SAFETY SCAN PASSED</span>
                    </>
                  )}
                </div>

                {scanResult.allowlistedProjectEligible && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    Allowlist Eligible (Passcode Required)
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300">{scanResult.reason}</p>

              {scanResult.detectedSnippets.length > 0 && (
                <div className="text-[11px] font-mono text-slate-400 bg-slate-950/80 p-2 rounded border border-slate-800">
                  Flags: {scanResult.detectedSnippets.join(", ")}
                </div>
              )}

              <div className="text-[11px] text-slate-400 pt-1">
                <strong>Mitigation:</strong> {scanResult.suggestedAction}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
