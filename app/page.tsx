'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchFilters } from '@/components/SearchFilters';
import { ContractCard } from '@/components/ContractCard';
import {
  Building2,
  Search,
  Bookmark,
  TrendingUp,
  AlertCircle,
  Settings,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Zap,
  Filter,
  Download,
} from 'lucide-react';
import type {
  SamOpportunity,
  SavedContract,
  SearchParams,
  CompanyProfile,
} from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<SamOpportunity[]>([]);
  const [savedContracts, setSavedContracts] = useState<SavedContract[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [scoringId, setScoringId] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [showOnlyScored, setShowOnlyScored] = useState(false);
  const [showOnlyGo, setShowOnlyGo] = useState(false);
  const [minScore, setMinScore] = useState(0);

  const LIMIT = 10;

  // Default quick search queries relevant to Iron Grove's capabilities
  const quickSearches = [
    { keyword: 'software development', label: 'Software Dev' },
    { keyword: 'web application development', label: 'Web Apps' },
    { keyword: 'IT modernization', label: 'IT Modernization' },
    { keyword: 'cloud services', label: 'Cloud Services' },
    { keyword: 'data analytics AI', label: 'AI & Analytics' },
    { naicsCode: '541511', label: 'NAICS 541511' },
    { naicsCode: '541512', label: 'NAICS 541512' },
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Auto-load software development results on initial load
  useEffect(() => {
    if (!initialLoading && opportunities.length === 0 && !loading) {
      // Auto-search for software development contracts
      searchOpportunities({ keyword: 'software development' }, 0);
    }
  }, [initialLoading]);

  const fetchInitialData = async () => {
    setInitialLoading(true);
    await Promise.all([fetchSavedContracts(), fetchCompanyProfile()]);
    setInitialLoading(false);
  };

  const fetchCompanyProfile = async () => {
    try {
      const response = await fetch('/api/company');
      if (response.ok) {
        const data = await response.json();
        setCompanyProfile(data);
      }
    } catch (error) {
      console.error('Error fetching company profile:', error);
    }
  };

  const fetchSavedContracts = async () => {
    try {
      const response = await fetch('/api/contracts');
      if (response.ok) {
        const data = await response.json();
        setSavedContracts(data);
      }
    } catch (error) {
      console.error('Error fetching saved contracts:', error);
    }
  };

  const searchOpportunities = useCallback(
    async (params: SearchParams, offset = 0) => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (params.keyword) queryParams.append('keyword', params.keyword);
        if (params.naicsCode) queryParams.append('naicsCode', params.naicsCode);
        if (params.typeOfSetAside && params.typeOfSetAside !== 'none') {
          queryParams.append('typeOfSetAside', params.typeOfSetAside);
        }
        if (params.postedFrom)
          queryParams.append('postedFrom', params.postedFrom);
        if (params.postedTo) queryParams.append('postedTo', params.postedTo);
        queryParams.append('limit', String(LIMIT));
        queryParams.append('offset', String(offset));

        const response = await fetch(`/api/sam?${queryParams.toString()}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || 'Failed to search opportunities'
          );
        }

        let data = await response.json();
        let opportunities = data.opportunitiesData || [];
        
        // Client-side filtering based on scores (since SAM API doesn't support this)
        if (savedContracts.length > 0) {
          // Filter out low-scoring opportunities if they've been scored
          opportunities = opportunities.map((opp: SamOpportunity) => {
            const saved = savedContracts.find(c => c.id === opp.noticeId);
            return { ...opp, score: saved?.score };
          });
          
          // Sort by score if available (highest first)
          opportunities.sort((a: any, b: any) => {
            if (!a.score && !b.score) return 0;
            if (!a.score) return 1;
            if (!b.score) return -1;
            return (b.score.overallScore || 0) - (a.score.overallScore || 0);
          });
        }
        
        setOpportunities(opportunities);
        setTotalRecords(data.totalRecords || 0);
        setCurrentOffset(offset);
        setSearchParams(params);
        setFromCache(data.fromCache || false);
      } catch (error) {
        console.error('Error searching:', error);
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to search opportunities'
        );
        setOpportunities([]);
      } finally {
        setLoading(false);
      }
    },
    [savedContracts]
  );

  const handleSearch = (params: SearchParams) => {
    // Clear result filters when doing a new search
    setShowOnlyScored(false);
    setShowOnlyGo(false);
    setMinScore(0);
    searchOpportunities(params, 0);
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    const newOffset =
      direction === 'next'
        ? currentOffset + LIMIT
        : Math.max(0, currentOffset - LIMIT);
    searchOpportunities(searchParams, newOffset);
  };

  const handleSaveOpportunity = async (opportunity: SamOpportunity) => {
    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunity,
          status: 'reviewing',
        }),
      });

      if (response.ok) {
        const saved = await response.json();
        setSavedContracts((prev) => {
          const exists = prev.some((c) => c.id === saved.id);
          if (exists) return prev;
          return [...prev, saved];
        });
      }
    } catch (error) {
      console.error('Error saving opportunity:', error);
    }
  };

  const handleScoreOpportunity = async (opportunity: SamOpportunity) => {
    if (!companyProfile) {
      alert('Please set up your company profile first');
      router.push('/company');
      return;
    }

    setScoringId(opportunity.noticeId);
    try {
      const response = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity }),
      });

      if (response.ok) {
        const score = await response.json();

        // Save the contract with the score
        const saveResponse = await fetch('/api/contracts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            opportunity,
            score,
            status: 'reviewing',
          }),
        });

        if (saveResponse.ok) {
          const saved = await saveResponse.json();
          setSavedContracts((prev) => {
            const filtered = prev.filter((c) => c.id !== saved.id);
            return [...filtered, saved];
          });
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to score opportunity');
      }
    } catch (error) {
      console.error('Error scoring:', error);
      alert('Failed to score opportunity');
    } finally {
      setScoringId(null);
    }
  };

  const handleViewContract = (id: string) => {
    router.push(`/contracts/${id}`);
  };

  const isOpportunitySaved = (noticeId: string) => {
    return savedContracts.some((c) => c.id === noticeId);
  };

  const getOpportunityScore = (noticeId: string) => {
    const saved = savedContracts.find((c) => c.id === noticeId);
    return saved?.score;
  };

  // Stats calculations
  // Apply client-side filters to opportunities  
  const filteredOpportunities = opportunities.filter(opp => {
    const saved = savedContracts.find(c => c.id === opp.noticeId);
    
    if (showOnlyScored && !saved?.score) return false;
    if (showOnlyGo && saved?.score?.analysis.bidNoGoBid !== 'GO') return false;
    if (minScore > 0 && (!saved?.score || saved.score.overallScore < minScore)) return false;
    
    return true;
  });

  const stats = {
    total: savedContracts.length,
    reviewing: savedContracts.filter((c) => c.status === 'reviewing').length,
    pursuing: savedContracts.filter((c) => c.status === 'pursuing').length,
    submitted: savedContracts.filter((c) => c.status === 'submitted').length,
    avgScore:
      savedContracts.filter((c) => c.score).length > 0
        ? Math.round(
            savedContracts
              .filter((c) => c.score)
              .reduce((sum, c) => sum + (c.score?.overallScore || 0), 0) /
              savedContracts.filter((c) => c.score).length
          )
        : 0,
  };

  const totalPages = Math.ceil(totalRecords / LIMIT);
  const currentPage = Math.floor(currentOffset / LIMIT) + 1;

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <Skeleton className="h-20 w-full" />
            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  GovContracts
                </h1>
                <p className="text-xs text-slate-400">
                  Federal Opportunity Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {companyProfile ? (
                <Link href="/company">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-slate-600 hover:bg-slate-800"
                  >
                    <Building2 className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {companyProfile.name}
                    </span>
                    <span className="sm:hidden">Profile</span>
                  </Button>
                </Link>
              ) : (
                <Link href="/company">
                  <Button
                    size="sm"
                    className="gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900"
                  >
                    <Settings className="h-4 w-4" />
                    Setup Profile
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Banner */}
        {!companyProfile && (
          <Card className="mb-8 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-200">
                    Complete Your Setup
                  </h3>
                  <p className="text-sm text-amber-300/80">
                    Set up your company profile to enable AI-powered opportunity
                    scoring and PDF generation.
                  </p>
                </div>
                <Link href="/company">
                  <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                    Get Started
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">
                Saved Opportunities
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-slate-100">
                {stats.total}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-slate-400">
                <Bookmark className="h-4 w-4" />
                <span>Total tracked</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">
                Actively Reviewing
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-blue-400">
                {stats.reviewing}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-slate-400">
                <Search className="h-4 w-4" />
                <span>Under evaluation</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">
                Pursuing
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-emerald-400">
                {stats.pursuing}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-slate-400">
                <TrendingUp className="h-4 w-4" />
                <span>Active pursuits</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">
                Average Score
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-amber-400">
                {stats.avgScore > 0 ? stats.avgScore : '—'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-slate-400">
                <Sparkles className="h-4 w-4" />
                <span>AI fit score</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger
              value="search"
              className="gap-2 data-[state=active]:bg-slate-700"
            >
              <Search className="h-4 w-4" />
              Search Opportunities
            </TabsTrigger>
            <TabsTrigger
              value="saved"
              className="gap-2 data-[state=active]:bg-slate-700"
            >
              <Bookmark className="h-4 w-4" />
              Saved ({stats.total})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            {/* Quick Search Buttons */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-300">
                  <Zap className="h-4 w-4 text-amber-400" />
                  Quick Search
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Pre-filtered searches for relevant opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {quickSearches.map((qs, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="border-slate-600 hover:bg-amber-500/20 hover:border-amber-500/50 hover:text-amber-200"
                      onClick={async () => {
                        setLoading(true);
                        setError(null);
                        try {
                          const queryParams = new URLSearchParams();
                          queryParams.append('useSample', 'true');
                          queryParams.append('limit', String(LIMIT));
                          queryParams.append('offset', '0');
                          
                          if (qs.naicsCode) {
                            queryParams.append('naicsCode', qs.naicsCode);
                            setSearchParams({ naicsCode: qs.naicsCode });
                          } else if (qs.keyword) {
                            queryParams.append('keyword', qs.keyword);
                            setSearchParams({ keyword: qs.keyword });
                          }
                          
                          const response = await fetch(`/api/sam?${queryParams.toString()}`);
                          if (response.ok) {
                            const data = await response.json();
                            setOpportunities(data.opportunitiesData || []);
                            setTotalRecords(data.totalRecords || 0);
                            setCurrentOffset(0);
                            setFromCache(false);
                          }
                        } catch (error) {
                          console.error('Error searching:', error);
                          setError('Failed to search opportunities');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                    >
                      {qs.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Search Filters */}
            <SearchFilters onSearch={handleSearch} loading={loading} />

            {/* Result Filters */}
            {opportunities.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showOnlyScored"
                        checked={showOnlyScored}
                        onChange={(e) => setShowOnlyScored(e.target.checked)}
                        className="rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500"
                      />
                      <label htmlFor="showOnlyScored" className="text-sm text-slate-300 cursor-pointer">
                        Show only scored opportunities
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showOnlyGo"
                        checked={showOnlyGo}
                        onChange={(e) => setShowOnlyGo(e.target.checked)}
                        className="rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <label htmlFor="showOnlyGo" className="text-sm text-slate-300 cursor-pointer">
                        Show only "GO" recommendations
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <label htmlFor="minScore" className="text-sm text-slate-300">
                        Min Score: {minScore}
                      </label>
                      <input
                        type="range"
                        id="minScore"
                        min="0"
                        max="100"
                        step="10"
                        value={minScore}
                        onChange={(e) => setMinScore(parseInt(e.target.value))}
                        className="w-32"
                      />
                    </div>
                    {(showOnlyScored || showOnlyGo || minScore > 0) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowOnlyScored(false);
                          setShowOnlyGo(false);
                          setMinScore(0);
                        }}
                        className="text-amber-400 hover:text-amber-300"
                      >
                        Clear Filters
                      </Button>
                    )}
                    <div className="ml-auto text-sm text-slate-400">
                      {filteredOpportunities.length} of {opportunities.length} shown
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Message */}
            {error && (
              <Card className="bg-red-500/10 border-red-500/30">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div>
                      <p className="font-medium text-red-200">Search Error</p>
                      <p className="text-sm text-red-300/80">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="py-6">
                      <div className="space-y-4">
                        <Skeleton className="h-6 w-3/4 bg-slate-700" />
                        <Skeleton className="h-4 w-1/2 bg-slate-700" />
                        <Skeleton className="h-20 w-full bg-slate-700" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : opportunities.length > 0 ? (
              <>
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>
                      Showing {currentOffset + 1} -{' '}
                      {Math.min(currentOffset + LIMIT, totalRecords)} of{' '}
                      {totalRecords.toLocaleString()} results
                    </span>
                    {fromCache && (
                      <Badge
                        variant="outline"
                        className="bg-emerald-950 border-emerald-700 text-emerald-400 text-xs"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Cached
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Download CSV of all cached opportunities
                        window.open('/api/export-cache', '_blank');
                      }}
                      className="gap-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                    >
                      <Download className="h-4 w-4" />
                      Export CSV
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Force refresh from SAM.gov API
                        const queryParams = new URLSearchParams();
                        if (searchParams.keyword)
                          queryParams.append('keyword', searchParams.keyword);
                        if (searchParams.naicsCode)
                          queryParams.append('naicsCode', searchParams.naicsCode);
                        queryParams.append('refresh', 'true');
                        queryParams.append('limit', String(LIMIT));
                        queryParams.append('offset', String(currentOffset));
                        fetch(`/api/sam?${queryParams.toString()}`)
                          .then((res) => res.json())
                          .then((data) => {
                            setOpportunities(data.opportunitiesData || []);
                            setTotalRecords(data.totalRecords || 0);
                            setFromCache(false);
                          });
                      }}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </div>

                {filteredOpportunities.length === 0 ? (
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="py-12 text-center">
                      <Filter className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                      <h3 className="text-lg font-medium text-slate-300">
                        No Results Match Filters
                      </h3>
                      <p className="text-slate-400 mt-1">
                        {opportunities.length} opportunities found, but none match your active filters.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowOnlyScored(false);
                          setShowOnlyGo(false);
                          setMinScore(0);
                        }}
                        className="mt-4 border-amber-500 text-amber-400 hover:bg-amber-500/10"
                      >
                        Clear All Filters
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filteredOpportunities.map((opp) => (
                      <ContractCard
                        key={opp.noticeId}
                        opportunity={opp}
                        score={getOpportunityScore(opp.noticeId)}
                        isSaved={isOpportunitySaved(opp.noticeId)}
                        onSave={() => handleSaveOpportunity(opp)}
                        onScore={() => handleScoreOpportunity(opp)}
                        onView={() => handleViewContract(opp.noticeId)}
                        scoring={scoringId === opp.noticeId}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange('prev')}
                      disabled={currentOffset === 0}
                      className="gap-2 border-slate-600 hover:bg-slate-800"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-slate-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange('next')}
                      disabled={currentOffset + LIMIT >= totalRecords}
                      className="gap-2 border-slate-600 hover:bg-slate-800"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : searchParams.keyword || searchParams.naicsCode ? (
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                  <h3 className="text-lg font-medium text-slate-300">
                    No Results Found
                  </h3>
                  <p className="text-slate-400 mt-1">
                    Try adjusting your search filters or keywords
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                  <h3 className="text-lg font-medium text-slate-300">
                    Search Federal Opportunities
                  </h3>
                  <p className="text-slate-400 mt-1">
                    Enter keywords, NAICS codes, or use filters to find relevant
                    contract opportunities from SAM.gov
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            {savedContracts.length > 0 ? (
              <>
                {/* Filter by status */}
                <div className="flex gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className="cursor-pointer border-slate-600"
                  >
                    All ({stats.total})
                  </Badge>
                  <Badge
                    variant="outline"
                    className="cursor-pointer border-slate-600"
                  >
                    Reviewing ({stats.reviewing})
                  </Badge>
                  <Badge
                    variant="outline"
                    className="cursor-pointer border-slate-600"
                  >
                    Pursuing ({stats.pursuing})
                  </Badge>
                  <Badge
                    variant="outline"
                    className="cursor-pointer border-slate-600"
                  >
                    Submitted ({stats.submitted})
                  </Badge>
                </div>

                <div className="space-y-4">
                  {savedContracts.map((contract) => (
                    <ContractCard
                      key={contract.id}
                      opportunity={contract.opportunity}
                      score={contract.score}
                      isSaved={true}
                      onView={() => handleViewContract(contract.id)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="py-12 text-center">
                  <Bookmark className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                  <h3 className="text-lg font-medium text-slate-300">
                    No Saved Opportunities
                  </h3>
                  <p className="text-slate-400 mt-1">
                    Search for opportunities and save ones that interest you
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <p>GovContracts Dashboard — Federal Opportunity Management</p>
            <p>Data sourced from SAM.gov</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
