'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AgentReasoningCard } from '@/components/AgentReasoningCard';
import {
  Sparkles,
  ArrowLeft,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Download,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Zap,
  Database,
} from 'lucide-react';
import type { AgentRun, GeneratedProposal } from '@/types';

export default function AgentDashboard() {
  const [currentRun, setCurrentRun] = useState<AgentRun | null>(null);
  const [pastRuns, setPastRuns] = useState<AgentRun[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPastRuns, setShowPastRuns] = useState(false);
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null);

  useEffect(() => {
    loadPastRuns();
  }, []);

  const loadPastRuns = async () => {
    try {
      const response = await fetch('/api/agent/runs');
      if (response.ok) {
        const runs = await response.json();
        setPastRuns(runs);
        
        // Load the most recent run if no current run
        if (!currentRun && runs.length > 0) {
          setCurrentRun(runs[0]);
        }
      }
    } catch (error) {
      console.error('Error loading past runs:', error);
    }
  };

  const handleRunAgent = async () => {
    setIsRunning(true);
    setError(null);
    
    try {
      const response = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchParams: {
            keyword: 'software development',
            limit: 15,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to run agent');
      }

      const run = await response.json();
      setCurrentRun(run);
      await loadPastRuns();
    } catch (error) {
      console.error('Error running agent:', error);
      setError(error instanceof Error ? error.message : 'Failed to run agent');
    } finally {
      setIsRunning(false);
    }
  };

  const handleGenerateProposals = async () => {
    if (!currentRun) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/agent/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: currentRun.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate proposals');
      }

      const updatedRun = await response.json();
      setCurrentRun(updatedRun);
      await loadPastRuns();
    } catch (error) {
      console.error('Error generating proposals:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate proposals');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewProposal = (opportunityId: string, proposal: GeneratedProposal) => {
    const proposalWindow = window.open('', '_blank');
    if (proposalWindow) {
      proposalWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Proposal - ${opportunityId}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 900px;
              margin: 40px auto;
              padding: 20px;
              line-height: 1.6;
              color: #333;
            }
            h1 { color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px; }
            h2 { color: #1e40af; margin-top: 30px; }
            h3 { color: #3b82f6; margin-top: 20px; }
            .score-section {
              background: #f0f9ff;
              padding: 15px;
              border-left: 4px solid #1e40af;
              margin: 20px 0;
            }
            .metadata {
              background: #f8fafc;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .print-button {
              position: fixed;
              top: 20px;
              right: 20px;
              padding: 10px 20px;
              background: #1e40af;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
            }
            @media print {
              .print-button { display: none; }
            }
          </style>
        </head>
        <body>
          <button class="print-button" onclick="window.print()">Print / Save PDF</button>
          
          <h1>Government Contract Proposal</h1>
          
          <div class="metadata">
            <p><strong>Opportunity ID:</strong> ${opportunityId}</p>
            <p><strong>Generated:</strong> ${new Date(proposal.generatedAt).toLocaleString()}</p>
          </div>
          
          <div class="score-section">
            <h2>Opportunity Score Analysis</h2>
            <p><strong>Overall Score:</strong> ${proposal.score.overallScore}/100</p>
            <p><strong>NAICS Match:</strong> ${proposal.score.naicsMatch}/100</p>
            <p><strong>Capability Match:</strong> ${proposal.score.capabilityMatch}/100</p>
            <p><strong>Recommendation:</strong> ${proposal.score.analysis.bidNoGoBid}</p>
            <p><strong>Summary:</strong> ${proposal.score.analysis.summary}</p>
          </div>
          
          <div>
            ${proposal.proposalOutline.replace(/\n/g, '<br>')}
          </div>
        </body>
        </html>
      `);
      proposalWindow.document.close();
    }
  };

  const getStatusBadge = (status: AgentRun['status']) => {
    switch (status) {
      case 'selecting':
        return (
          <Badge variant="outline" className="bg-blue-950 border-blue-700 text-blue-400">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Selecting
          </Badge>
        );
      case 'awaiting_approval':
        return (
          <Badge variant="outline" className="bg-yellow-950 border-yellow-700 text-yellow-400">
            <Clock className="h-3 w-3 mr-1" />
            Awaiting Approval
          </Badge>
        );
      case 'generating':
        return (
          <Badge variant="outline" className="bg-purple-950 border-purple-700 text-purple-400">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Generating
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-emerald-950 border-emerald-700 text-emerald-400">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="bg-red-950 border-red-700 text-red-400">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/">
              <Button variant="ghost" className="gap-2 mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-blue-400" />
              AI Agent Dashboard
            </h1>
            <p className="text-slate-400 mt-2">
              Autonomous opportunity selection and proposal generation
            </p>
          </div>
          <Button
            onClick={handleRunAgent}
            disabled={isRunning}
            size="lg"
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Running Agent...
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Run Agent Analysis
              </>
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="bg-red-950/50 border-red-700 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isRunning && !currentRun && (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
                <p className="text-slate-400">Analyzing opportunities...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Run Display */}
        {currentRun && (
          <div className="space-y-6">
            {/* Run Header */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      Agent Run Results
                      {getStatusBadge(currentRun.status)}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Started: {new Date(currentRun.startedAt).toLocaleString()}
                      {currentRun.completedAt && (
                        <> • Completed: {new Date(currentRun.completedAt).toLocaleString()}</>
                      )}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadPastRuns}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Cost Tracking */}
            {currentRun.costTracking && (
              <Card className="bg-gradient-to-r from-emerald-950/30 to-blue-950/30 border-emerald-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-400">
                    <DollarSign className="h-5 w-5" />
                    Cost & Token Usage
                  </CardTitle>
                  <CardDescription>
                    Detailed breakdown of API costs and token consumption
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total Cost */}
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-emerald-700/30">
                      <div className="flex items-center gap-2 text-emerald-400 mb-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm font-semibold">Total Cost</span>
                      </div>
                      <p className="text-3xl font-bold text-white">
                        ${currentRun.costTracking.totalCost.toFixed(4)}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {currentRun.costTracking.totalTokens.toLocaleString()} tokens
                      </p>
                    </div>

                    {/* Selection Phase */}
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-blue-700/30">
                      <div className="flex items-center gap-2 text-blue-400 mb-2">
                        <Zap className="h-4 w-4" />
                        <span className="text-sm font-semibold">Selection Phase</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        ${currentRun.costTracking.selectionPhase.estimatedCost.toFixed(4)}
                      </p>
                      <div className="text-xs text-slate-400 mt-1 space-y-1">
                        <p>{currentRun.costTracking.selectionPhase.totalTokens.toLocaleString()} tokens</p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="bg-emerald-950 px-2 py-0.5 rounded text-emerald-400">
                            <Database className="h-3 w-3 inline mr-1" />
                            {currentRun.costTracking.selectionPhase.cachedScores} cached
                          </span>
                          <span className="bg-blue-950 px-2 py-0.5 rounded text-blue-400">
                            {currentRun.costTracking.selectionPhase.newScores} new
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Proposal Phase */}
                    {currentRun.costTracking.proposalPhase && (
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-700/30">
                        <div className="flex items-center gap-2 text-purple-400 mb-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm font-semibold">Proposal Phase</span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          ${currentRun.costTracking.proposalPhase.estimatedCost.toFixed(4)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {currentRun.costTracking.proposalPhase.totalTokens.toLocaleString()} tokens
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Detailed Token Breakdown */}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-300">
                      View Detailed Token Breakdown
                    </summary>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="bg-slate-800/30 p-3 rounded">
                        <h4 className="font-semibold text-slate-300 mb-2">Selection Phase</h4>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">Prompt:</span>
                            <span className="text-slate-300 ml-2">
                              {currentRun.costTracking.selectionPhase.promptTokens.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Completion:</span>
                            <span className="text-slate-300 ml-2">
                              {currentRun.costTracking.selectionPhase.completionTokens.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Total:</span>
                            <span className="text-slate-300 ml-2">
                              {currentRun.costTracking.selectionPhase.totalTokens.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {currentRun.costTracking.proposalPhase && (
                        <div className="bg-slate-800/30 p-3 rounded">
                          <h4 className="font-semibold text-slate-300 mb-2">Proposal Phase</h4>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-slate-500">Prompt:</span>
                              <span className="text-slate-300 ml-2">
                                {currentRun.costTracking.proposalPhase.promptTokens.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">Completion:</span>
                              <span className="text-slate-300 ml-2">
                                {currentRun.costTracking.proposalPhase.completionTokens.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">Total:</span>
                              <span className="text-slate-300 ml-2">
                                {currentRun.costTracking.proposalPhase.totalTokens.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-slate-500 mt-2">
                        <p>• Pricing: GPT-4o-mini ($0.15 per 1M prompt tokens, $0.60 per 1M completion tokens)</p>
                        <p>• Cache hits save ~$0.001-0.003 per opportunity</p>
                      </div>
                    </div>
                  </details>
                </CardContent>
              </Card>
            )}

            {/* Selection Strategy */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-lg">Selection Strategy & Reasoning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Methodology</h3>
                  <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
                    {currentRun.selectionReasoning.selectionStrategy}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">
                    Evaluated {currentRun.selectionReasoning.totalEvaluated} Opportunities
                  </h3>
                  <p className="text-sm text-slate-400">
                    Selected top {currentRun.selectedOpportunities.length} based on multi-factor weighted analysis
                  </p>
                </div>

                {/* Decision Log Preview */}
                {currentRun.selectionReasoning.decisionLog.length > 0 && (
                  <details className="text-xs text-slate-500">
                    <summary className="cursor-pointer hover:text-slate-400">
                      View Decision Log ({currentRun.selectionReasoning.decisionLog.length} entries)
                    </summary>
                    <ul className="mt-2 space-y-1 pl-4">
                      {currentRun.selectionReasoning.decisionLog.map((log, i) => (
                        <li key={i}>{log}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </CardContent>
            </Card>

            {/* Selected Opportunities */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">
                Top {currentRun.selectedOpportunities.length} Selected Opportunities
              </h2>
              
              {currentRun.selectedOpportunities.map((selected, index) => (
                <AgentReasoningCard
                  key={selected.opportunity.noticeId}
                  selectedOpportunity={selected}
                  index={index}
                />
              ))}
            </div>

            {/* Approval Section */}
            {currentRun.status === 'awaiting_approval' && (
              <Card className="bg-blue-950/30 border-blue-700/50">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Ready to Generate Proposals
                      </h3>
                      <p className="text-sm text-slate-400">
                        The agent has selected the top 5 opportunities. Click below to generate detailed proposals for each.
                      </p>
                    </div>
                    <Button
                      onClick={handleGenerateProposals}
                      disabled={isGenerating}
                      size="lg"
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-5 w-5" />
                          Approve & Generate Proposals
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generated Proposals */}
            {currentRun.generatedProposals && currentRun.generatedProposals.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-400" />
                    Generated Proposals ({currentRun.generatedProposals.length})
                  </CardTitle>
                  <CardDescription>
                    Detailed proposal outlines ready for download and review
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentRun.generatedProposals.map((proposal, index) => {
                      const opportunity = currentRun.selectedOpportunities.find(
                        s => s.opportunity.noticeId === proposal.opportunityId
                      )?.opportunity;
                      
                      return (
                        <div
                          key={proposal.opportunityId}
                          className="border border-slate-700 rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-white">
                                {opportunity?.title || proposal.opportunityId}
                              </h4>
                              <div className="flex gap-3 mt-2 text-sm text-slate-400">
                                <span>Score: {proposal.score.overallScore}/100</span>
                                <span>•</span>
                                <span className={
                                  proposal.score.analysis.bidNoGoBid === 'GO' 
                                    ? 'text-emerald-400' 
                                    : proposal.score.analysis.bidNoGoBid === 'NO-GO'
                                    ? 'text-red-400'
                                    : 'text-yellow-400'
                                }>
                                  {proposal.score.analysis.bidNoGoBid}
                                </span>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleViewProposal(proposal.opportunityId, proposal)}
                              size="sm"
                              className="gap-2"
                            >
                              <Download className="h-4 w-4" />
                              View Proposal
                            </Button>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedProposal(
                              expandedProposal === proposal.opportunityId ? null : proposal.opportunityId
                            )}
                            className="w-full justify-between"
                          >
                            <span>Preview Proposal</span>
                            {expandedProposal === proposal.opportunityId ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                          
                          {expandedProposal === proposal.opportunityId && (
                            <div className="text-sm text-slate-400 whitespace-pre-line max-h-96 overflow-y-auto bg-slate-900/50 p-4 rounded">
                              {proposal.proposalOutline}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Past Runs */}
        {pastRuns.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700/50 mt-8">
            <CardHeader>
              <Button
                variant="ghost"
                onClick={() => setShowPastRuns(!showPastRuns)}
                className="w-full justify-between"
              >
                <CardTitle>Past Agent Runs ({pastRuns.length})</CardTitle>
                {showPastRuns ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </CardHeader>
            {showPastRuns && (
              <CardContent>
                <div className="space-y-2">
                  {pastRuns.map((run) => (
                    <button
                      key={run.id}
                      onClick={() => setCurrentRun(run)}
                      className="w-full text-left p-3 rounded border border-slate-700 hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(run.status)}
                            <span className="text-sm text-slate-400">
                              {new Date(run.startedAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300">
                            {run.selectedOpportunities.length} opportunities selected
                            {run.generatedProposals && ` • ${run.generatedProposals.length} proposals generated`}
                          </p>
                        </div>
                        {currentRun?.id === run.id && (
                          <Badge variant="outline" className="bg-blue-950 border-blue-700 text-blue-400">
                            Current
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
