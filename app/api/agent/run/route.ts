import { NextRequest, NextResponse } from 'next/server';
import { AgentOrchestrator } from '@/lib/agent/agent-orchestrator';
import { saveAgentRun } from '@/lib/storage';
import type { SearchParams } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = body as { searchParams?: SearchParams };
    
    console.log('Starting agent run with params:', searchParams);
    
    const orchestrator = new AgentOrchestrator();
    const run = await orchestrator.runAgent(searchParams);
    
    // Save the run to storage
    await saveAgentRun(run);
    
    console.log('Agent run completed:', run.id);
    
    return NextResponse.json(run);
  } catch (error) {
    console.error('Error running agent:', error);
    return NextResponse.json(
      { 
        error: 'Failed to run agent',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
