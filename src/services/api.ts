import {
  DiscernmentReport,
  AgentSkillPackage,
  AppAuditReport,
  IntakeModality,
  ProcessingMode,
  DefenseScanResult,
  SecurityClearance,
} from "../types";

export interface PipelineResult {
  title: string;
  mode: string;
  overview: string;
  keyTakeaways: string[];
  sections: {
    heading: string;
    content: string;
    actionItems?: string[];
  }[];
  safetyWarnings?: string[];
  executionChecklist: string[];
}

export async function scanDefenseSafety(content: string): Promise<DefenseScanResult> {
  const res = await fetch("/api/defense/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Defense scan failed with status ${res.status}`);
  }

  return await res.json();
}

export async function authorizeDefensePasscode(
  passcode: string,
  projectName?: string,
  scope?: string
): Promise<SecurityClearance> {
  const res = await fetch("/api/defense/authorize-passcode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passcode, projectName, scope }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Defense-of-Break Passcode authorization failed.");
  }

  return await res.json();
}

export async function runDiscernmentAudit(
  content: string,
  inputType: IntakeModality,
  sourceUrl?: string,
  mode: ProcessingMode = "evaluate",
  securityPasscode?: string
): Promise<DiscernmentReport> {
  const res = await fetch("/api/discern", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, inputType, sourceUrl, mode, securityPasscode }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Discernment failed with status ${res.status}`);
  }

  const data = await res.json();
  return {
    ...data,
    id: `audit-${Date.now()}`,
    title: sourceUrl ? `Audit: ${sourceUrl}` : "Opportunity Discernment Report",
    sourceType: inputType,
    sourceUrl,
    createdAt: new Date().toISOString(),
  };
}

export async function buildAgentSkill(
  tutorialContent: string,
  skillName: string,
  targetPlatform: string = "universal",
  sourceModality: IntakeModality = "text",
  securityPasscode?: string
): Promise<AgentSkillPackage> {
  const res = await fetch("/api/skills/build", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tutorialContent,
      skillName,
      targetPlatform,
      sourceModality,
      securityPasscode,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Skill generation failed with status ${res.status}`);
  }

  const data = await res.json();
  return {
    ...data,
    id: `skill-${Date.now()}`,
    targetPlatform,
    sourceModality,
    createdAt: new Date().toISOString(),
  };
}

export async function runPreFlightScan(
  appName: string,
  stackDescription?: string,
  liveUrl?: string,
  repoUrl?: string,
  codeSnippets?: string
): Promise<AppAuditReport> {
  const res = await fetch("/api/audit/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ appName, stackDescription, liveUrl, repoUrl, codeSnippets }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Pre-flight scan failed with status ${res.status}`);
  }

  const data = await res.json();
  return {
    ...data,
    id: `scan-${Date.now()}`,
    liveUrl,
    repoUrl,
    stackDescription,
    createdAt: new Date().toISOString(),
  };
}

export async function processPipeline(
  mode: ProcessingMode,
  rawContent: string,
  inputType: IntakeModality,
  title?: string
): Promise<PipelineResult> {
  const res = await fetch("/api/pipeline/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, rawContent, inputType, title }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Pipeline failed with status ${res.status}`);
  }

  return await res.json();
}
