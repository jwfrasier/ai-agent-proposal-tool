import { NextRequest, NextResponse } from 'next/server';
import { getAllAgentRuns, getAgentRun, deleteAgentRun } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('id');
    
    if (runId) {
      // Get specific run
      const run = await getAgentRun(runId);
      if (!run) {
        return NextResponse.json(
          { error: 'Agent run not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(run);
    }
    
    // Get all runs
    const runs = await getAllAgentRuns();
    return NextResponse.json(runs);
  } catch (error) {
    console.error('Error fetching agent runs:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch agent runs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('id');
    
    if (!runId) {
      return NextResponse.json(
        { error: 'Run ID is required' },
        { status: 400 }
      );
    }
    
    const success = await deleteAgentRun(runId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Agent run not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting agent run:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete agent run',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
