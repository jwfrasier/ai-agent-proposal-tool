import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { searchOpportunities } from '@/lib/sam-api';
import { getCachedSearch, setCachedSearch } from '@/lib/storage';
import type { SearchParams, SamOpportunity } from '@/types';

// Load sample opportunities for demo/testing
async function getSampleOpportunities(): Promise<SamOpportunity[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'sample-opportunities.json');
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Filter sample opportunities based on search params
function filterSampleOpportunities(
  opportunities: SamOpportunity[],
  params: SearchParams
): SamOpportunity[] {
  return opportunities.filter(opp => {
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      const matchesTitle = opp.title.toLowerCase().includes(keyword);
      const matchesDesc = opp.description?.toLowerCase().includes(keyword);
      const matchesDept = opp.department?.toLowerCase().includes(keyword);
      if (!matchesTitle && !matchesDesc && !matchesDept) return false;
    }
    if (params.naicsCode) {
      const hasNaics = opp.naicsCode === params.naicsCode || 
                       opp.naicsCodes?.includes(params.naicsCode);
      if (!hasNaics) return false;
    }
    if (params.typeOfSetAside) {
      if (opp.typeOfSetAside !== params.typeOfSetAside) return false;
    }
    return true;
  });
}

// Generate a cache key from search params
function generateCacheKey(params: SearchParams): string {
  const parts = [
    params.keyword || '',
    params.naicsCode || '',
    params.typeOfSetAside || '',
    params.postedFrom || '',
    params.postedTo || '',
    String(params.limit || 25),
    String(params.offset || 0),
  ];
  return parts.join('|');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params: SearchParams = {
      keyword: searchParams.get('keyword') || undefined,
      naicsCode: searchParams.get('naicsCode') || undefined,
      typeOfSetAside: searchParams.get('typeOfSetAside') || undefined,
      postedFrom: searchParams.get('postedFrom') || undefined,
      postedTo: searchParams.get('postedTo') || undefined,
      responseDeadlineFrom: searchParams.get('responseDeadlineFrom') || undefined,
      responseDeadlineTo: searchParams.get('responseDeadlineTo') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 25,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };
    
    // Check if we should skip cache (force refresh) or use sample data
    const skipCache = searchParams.get('refresh') === 'true';
    const useSample = searchParams.get('useSample') === 'true';
    const cacheKey = generateCacheKey(params);
    
    // If explicitly requesting sample data, return filtered samples
    if (useSample) {
      console.log('Using sample data for:', cacheKey);
      const sampleOpportunities = await getSampleOpportunities();
      const filtered = filterSampleOpportunities(sampleOpportunities, params);
      
      return NextResponse.json({
        totalRecords: filtered.length,
        limit: params.limit || 25,
        offset: params.offset || 0,
        opportunitiesData: filtered.slice(params.offset || 0, (params.offset || 0) + (params.limit || 25)),
        isDemo: true,
        fromCache: false,
      });
    }
    
    // Try to get from cache first
    if (!skipCache) {
      const cached = await getCachedSearch(cacheKey);
      if (cached) {
        console.log('Returning cached SAM.gov results for:', cacheKey);
        return NextResponse.json({ ...cached, fromCache: true });
      }
    }
    
    // Fetch from SAM.gov API
    const results = await searchOpportunities(params);
    
    // Cache the results
    await setCachedSearch(cacheKey, results);
    console.log('Cached new SAM.gov results for:', cacheKey);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching SAM.gov:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Fall back to sample data for demo purposes
    console.log('Falling back to sample opportunities for demo...');
    const sampleOpportunities = await getSampleOpportunities();
    
    if (sampleOpportunities.length > 0) {
      const params: SearchParams = {
        keyword: new URL(request.url).searchParams.get('keyword') || undefined,
        naicsCode: new URL(request.url).searchParams.get('naicsCode') || undefined,
        typeOfSetAside: new URL(request.url).searchParams.get('typeOfSetAside') || undefined,
        limit: new URL(request.url).searchParams.get('limit') ? parseInt(new URL(request.url).searchParams.get('limit')!) : 25,
        offset: new URL(request.url).searchParams.get('offset') ? parseInt(new URL(request.url).searchParams.get('offset')!) : 0,
      };
      
      const filtered = filterSampleOpportunities(sampleOpportunities, params);
      
      return NextResponse.json({
        totalRecords: filtered.length,
        limit: params.limit || 25,
        offset: params.offset || 0,
        opportunitiesData: filtered.slice(params.offset || 0, (params.offset || 0) + (params.limit || 25)),
        isDemo: true,
        demoMessage: 'Using sample data. SAM.gov API error: ' + errorMessage,
      });
    }
    
    // Check if it's an API key issue
    if (errorMessage.includes('SAM_GOV_API_KEY')) {
      return NextResponse.json(
        { 
          error: 'API Key Not Configured',
          message: 'Please set the SAM_GOV_API_KEY environment variable'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to search opportunities', message: errorMessage },
      { status: 500 }
    );
  }
}
