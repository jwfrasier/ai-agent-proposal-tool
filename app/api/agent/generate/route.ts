import { NextRequest, NextResponse } from 'next/server';
import { AgentOrchestrator } from '@/lib/agent/agent-orchestrator';
import { getAgentRun, saveAgentRun } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { runId } = body as { runId: string };
    
    if (!runId) {
      return NextResponse.json(
        { error: 'Run ID is required' },
        { status: 400 }
      );
    }
    
    console.log('Starting proposal generation for run:', runId);
    
    // Get the existing run
    const existingRun = await getAgentRun(runId);
    if (!existingRun) {
      return NextResponse.json(
        { error: 'Agent run not found' },
        { status: 404 }
      );
    }
    
    // Generate proposals
    const orchestrator = new AgentOrchestrator();
    const updatedRun = await orchestrator.generateProposals(existingRun);
    
    // Save the updated run
    await saveAgentRun(updatedRun);
    
    console.log('Proposal generation completed:', runId);
    
    return NextResponse.json(updatedRun);
  } catch (error) {
    console.error('Error generating proposals:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate proposals',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
