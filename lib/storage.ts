import { promises as fs } from 'fs';
import path from 'path';
import type { CompanyProfile, SavedContract, SamApiResponse, SamOpportunity, AgentRun, CachedOpportunityScore, OpportunityScore } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const COMPANY_PROFILE_FILE = path.join(DATA_DIR, 'company-profile.json');
const SAVED_CONTRACTS_FILE = path.join(DATA_DIR, 'saved-contracts.json');
const SAM_CACHE_FILE = path.join(DATA_DIR, 'sam-cache.json');
const AGENT_RESULTS_FILE = path.join(DATA_DIR, 'agent-results.json');
const SCORE_CACHE_FILE = path.join(DATA_DIR, 'opportunity-scores-cache.json');

// Cache expiry in milliseconds (24 hours)
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

interface CachedSearch {
  key: string;
  data: SamApiResponse;
  cachedAt: string;
}

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Company Profile Operations
export async function getCompanyProfile(): Promise<CompanyProfile | null> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(COMPANY_PROFILE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function saveCompanyProfile(profile: CompanyProfile): Promise<CompanyProfile> {
  await ensureDataDir();
  profile.updatedAt = new Date().toISOString();
  await fs.writeFile(COMPANY_PROFILE_FILE, JSON.stringify(profile, null, 2));
  return profile;
}

// Saved Contracts Operations
export async function getSavedContracts(): Promise<SavedContract[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(SAVED_CONTRACTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function getSavedContract(id: string): Promise<SavedContract | null> {
  const contracts = await getSavedContracts();
  return contracts.find(c => c.id === id) || null;
}

export async function saveContract(contract: SavedContract): Promise<SavedContract> {
  await ensureDataDir();
  const contracts = await getSavedContracts();
  
  const existingIndex = contracts.findIndex(c => c.id === contract.id);
  contract.updatedAt = new Date().toISOString();
  
  if (existingIndex >= 0) {
    contracts[existingIndex] = contract;
  } else {
    contract.savedAt = new Date().toISOString();
    contracts.push(contract);
  }
  
  await fs.writeFile(SAVED_CONTRACTS_FILE, JSON.stringify(contracts, null, 2));
  return contract;
}

export async function deleteSavedContract(id: string): Promise<boolean> {
  const contracts = await getSavedContracts();
  const filtered = contracts.filter(c => c.id !== id);
  
  if (filtered.length === contracts.length) {
    return false;
  }
  
  await fs.writeFile(SAVED_CONTRACTS_FILE, JSON.stringify(filtered, null, 2));
  return true;
}

export async function updateContractStatus(
  id: string,
  status: SavedContract['status']
): Promise<SavedContract | null> {
  const contracts = await getSavedContracts();
  const contract = contracts.find(c => c.id === id);
  
  if (!contract) return null;
  
  contract.status = status;
  contract.updatedAt = new Date().toISOString();
  
  await fs.writeFile(SAVED_CONTRACTS_FILE, JSON.stringify(contracts, null, 2));
  return contract;
}

export async function updateContractNotes(
  id: string,
  notes: string
): Promise<SavedContract | null> {
  const contracts = await getSavedContracts();
  const contract = contracts.find(c => c.id === id);
  
  if (!contract) return null;
  
  contract.notes = notes;
  contract.updatedAt = new Date().toISOString();
  
  await fs.writeFile(SAVED_CONTRACTS_FILE, JSON.stringify(contracts, null, 2));
  return contract;
}

export async function updateContractScore(
  id: string,
  score: SavedContract['score']
): Promise<SavedContract | null> {
  const contracts = await getSavedContracts();
  const contract = contracts.find(c => c.id === id);
  
  if (!contract) return null;
  
  contract.score = score;
  contract.updatedAt = new Date().toISOString();
  
  await fs.writeFile(SAVED_CONTRACTS_FILE, JSON.stringify(contracts, null, 2));
  return contract;
}

// SAM.gov Search Cache Operations
export async function getCachedSearch(cacheKey: string): Promise<SamApiResponse | null> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(SAM_CACHE_FILE, 'utf-8');
    const cache: CachedSearch[] = JSON.parse(data);
    
    const cached = cache.find(c => c.key === cacheKey);
    if (!cached) return null;
    
    // Check if cache is expired
    const cachedTime = new Date(cached.cachedAt).getTime();
    if (Date.now() - cachedTime > CACHE_EXPIRY_MS) {
      return null;
    }
    
    return cached.data;
  } catch {
    return null;
  }
}

export async function setCachedSearch(cacheKey: string, data: SamApiResponse): Promise<void> {
  await ensureDataDir();
  
  let cache: CachedSearch[] = [];
  try {
    const existing = await fs.readFile(SAM_CACHE_FILE, 'utf-8');
    cache = JSON.parse(existing);
  } catch {
    // File doesn't exist yet
  }
  
  // Remove existing entry for this key
  cache = cache.filter(c => c.key !== cacheKey);
  
  // Add new entry
  cache.push({
    key: cacheKey,
    data,
    cachedAt: new Date().toISOString(),
  });
  
  // Keep only last 20 cached searches
  if (cache.length > 20) {
    cache = cache.slice(-20);
  }
  
  await fs.writeFile(SAM_CACHE_FILE, JSON.stringify(cache, null, 2));
}

export async function clearSearchCache(): Promise<void> {
  try {
    await fs.unlink(SAM_CACHE_FILE);
  } catch {
    // File doesn't exist
  }
}

// Find an opportunity by ID in all cached search results
export async function getOpportunityFromCache(noticeId: string): Promise<SamOpportunity | null> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(SAM_CACHE_FILE, 'utf-8');
    const cache: CachedSearch[] = JSON.parse(data);
    
    // Search through all cached searches for the opportunity
    for (const cached of cache) {
      const opportunity = cached.data.opportunitiesData?.find(
        (opp: SamOpportunity) => opp.noticeId === noticeId
      );
      if (opportunity) {
        return opportunity;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Default queries for IT/Software contracts
export const defaultSearchQueries = [
  { keyword: 'software development', label: 'Software Development' },
  { keyword: 'web application', label: 'Web Applications' },
  { keyword: 'IT services', label: 'IT Services' },
  { keyword: 'cloud computing', label: 'Cloud Computing' },
  { keyword: 'data analytics', label: 'Data Analytics' },
  { naicsCode: '541511', label: 'Custom Programming (541511)' },
  { naicsCode: '541512', label: 'Systems Design (541512)' },
];

// Agent Run Operations
export async function saveAgentRun(run: AgentRun): Promise<void> {
  await ensureDataDir();
  let runs: AgentRun[] = [];
  
  try {
    const data = await fs.readFile(AGENT_RESULTS_FILE, 'utf-8');
    runs = JSON.parse(data);
  } catch {
    // File doesn't exist yet, start with empty array
  }
  
  // Find and update existing run or add new one
  const existingIndex = runs.findIndex(r => r.id === run.id);
  if (existingIndex >= 0) {
    runs[existingIndex] = run;
  } else {
    runs.unshift(run); // Add to beginning
  }
  
  // Keep only last 20 runs
  runs = runs.slice(0, 20);
  
  await fs.writeFile(AGENT_RESULTS_FILE, JSON.stringify(runs, null, 2));
}

export async function getAgentRun(runId: string): Promise<AgentRun | null> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(AGENT_RESULTS_FILE, 'utf-8');
    const runs: AgentRun[] = JSON.parse(data);
    return runs.find(r => r.id === runId) || null;
  } catch {
    return null;
  }
}

export async function getAllAgentRuns(): Promise<AgentRun[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(AGENT_RESULTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function deleteAgentRun(runId: string): Promise<boolean> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(AGENT_RESULTS_FILE, 'utf-8');
    const runs: AgentRun[] = JSON.parse(data);
    const filtered = runs.filter(r => r.id !== runId);
    
    if (filtered.length === runs.length) {
      return false; // Run not found
    }
    
    await fs.writeFile(AGENT_RESULTS_FILE, JSON.stringify(filtered, null, 2));
    return true;
  } catch {
    return false;
  }
}

// Opportunity Score Cache Operations
const SCORE_CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function getCachedScore(
  opportunityId: string,
  companyProfileId: string
): Promise<OpportunityScore | null> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(SCORE_CACHE_FILE, 'utf-8');
    const cache: CachedOpportunityScore[] = JSON.parse(data);
    
    const cached = cache.find(
      c => c.opportunityId === opportunityId && c.companyProfileId === companyProfileId
    );
    
    if (!cached) return null;
    
    // Check if cache is expired
    const cachedTime = new Date(cached.cachedAt).getTime();
    if (Date.now() - cachedTime > SCORE_CACHE_EXPIRY_MS) {
      return null;
    }
    
    return cached.score;
  } catch {
    return null;
  }
}

export async function setCachedScore(
  opportunityId: string,
  score: OpportunityScore,
  companyProfileId: string
): Promise<void> {
  await ensureDataDir();
  
  let cache: CachedOpportunityScore[] = [];
  try {
    const existing = await fs.readFile(SCORE_CACHE_FILE, 'utf-8');
    cache = JSON.parse(existing);
  } catch {
    // File doesn't exist yet
  }
  
  // Remove existing entry for this opportunity + company combo
  cache = cache.filter(
    c => !(c.opportunityId === opportunityId && c.companyProfileId === companyProfileId)
  );
  
  // Add new entry
  cache.push({
    opportunityId,
    score,
    cachedAt: new Date().toISOString(),
    companyProfileId,
  });
  
  // Keep only last 500 cached scores
  if (cache.length > 500) {
    cache = cache.slice(-500);
  }
  
  await fs.writeFile(SCORE_CACHE_FILE, JSON.stringify(cache, null, 2));
}

export async function clearScoreCache(): Promise<void> {
  try {
    await fs.unlink(SCORE_CACHE_FILE);
  } catch {
    // File doesn't exist
  }
}
