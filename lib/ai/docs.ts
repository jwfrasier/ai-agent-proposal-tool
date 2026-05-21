import { anthropic, costFor } from './client';
import { config } from '../config';
import type { CompanyProfile, Opportunity } from '../db/schema';

export type DocKind = 'capability' | 'analysis' | 'proposal' | 'compliance_matrix';

const SYSTEM_BASE = `You write federal-contracting documents for a small business bidding on opportunities at or below the Simplified Acquisition Threshold ($350,000). Past-performance records are NOT required at this threshold. Output clean Markdown only — no preamble, no commentary, no fenced code blocks wrapping the whole document.`;

function profileBlock(p: CompanyProfile): string {
  return [
    `Name: ${p.name}`,
    `UEI: ${p.uei}`,
    `CAGE: ${p.cageCode ?? 'n/a'}`,
    `NAICS: ${p.naicsCodes.join(', ')}`,
    `Certifications: ${p.certifications.join(', ') || 'none'}`,
    `Contact: ${p.contactName} <${p.contactEmail}>${p.contactPhone ? ` / ${p.contactPhone}` : ''}`,
    '',
    'Capabilities:',
    p.capabilities,
  ].join('\n');
}

function oppBlock(o: Opportunity): string {
  return [
    `Title: ${o.title}`,
    `Agency: ${o.agency}`,
    `NAICS: ${o.naics ?? 'n/a'}`,
    `Set-aside: ${o.setAside ?? 'none'}`,
    `Award ceiling: ${o.awardCeiling != null ? `$${o.awardCeiling.toLocaleString()}` : 'n/a'}`,
    `Response deadline: ${o.responseDeadline?.toISOString() ?? 'n/a'}`,
    '',
    'Description:',
    (o.description ?? '').slice(0, 10000),
  ].join('\n');
}

const KIND_PROMPTS: Record<DocKind, (opp: Opportunity, profile: CompanyProfile) => string> = {
  capability: (_o, p) => `Generate a 1-page Capability Statement for ${p.name}.
Sections: Company Overview, Core Capabilities, NAICS Codes, Certifications, Differentiators, Contact.
Use the profile data verbatim; do not invent past performance.

Profile:
${profileBlock(p)}`,

  analysis: (o, p) => `Generate a concise GO/NO-GO analysis memo for the opportunity below, evaluated against the profile.
Sections: Summary, NAICS & Set-Aside Fit, Capability Fit, Risks, Recommendation (GO/NO-GO/MAYBE with one-paragraph rationale).
Keep total length under 700 words.

Opportunity:
${oppBlock(o)}

Profile:
${profileBlock(p)}`,

  proposal: (o, p) => `Generate a proposal outline with draft prose for the opportunity below.
Sections: Executive Summary, Technical Approach, Management Approach, Pricing Approach (placeholders OK), Why ${p.name}.
This is a starting draft; the user will edit before submission. Stay grounded in the solicitation text.

Opportunity:
${oppBlock(o)}

Profile:
${profileBlock(p)}`,

  compliance_matrix: (o, _p) => `Generate a compliance matrix as a Markdown table for the opportunity below.
Columns: Requirement | Source (section/paragraph) | Mandatory? (Yes/No) | Our Response.
Extract every "shall", "must", or numbered requirement you can identify from the description. If a column value is unknowable, write "TBD".

Opportunity:
${oppBlock(o)}`,
};

export interface DocOutput {
  markdown: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
}

export async function generateDoc(
  kind: DocKind,
  opp: Opportunity,
  profile: CompanyProfile,
): Promise<DocOutput> {
  const promptFn = KIND_PROMPTS[kind];
  if (!promptFn) throw new Error(`Unknown doc kind: ${kind}`);

  const response = await anthropic.messages.create({
    model: config.anthropicModel,
    max_tokens: 4096,
    system: SYSTEM_BASE,
    messages: [{ role: 'user', content: promptFn(opp, profile) }],
  });

  const text = response.content
    .filter((c) => c.type === 'text')
    .map((c) => (c as { type: 'text'; text: string }).text)
    .join('\n')
    .trim();
  if (!text) throw new Error('Empty document from model');

  const promptTokens = response.usage.input_tokens;
  const completionTokens = response.usage.output_tokens;
  return {
    markdown: text,
    model: response.model,
    promptTokens,
    completionTokens,
    costUsd: costFor(response.model, promptTokens, completionTokens),
  };
}
