import { NextRequest, NextResponse } from 'next/server';
import { getSavedContract, updateContractStatus, updateContractNotes, updateContractScore } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contract = await getSavedContract(id);
    
    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(contract);
  } catch (error) {
    console.error('Error fetching contract:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    let contract = null;
    
    if (body.status !== undefined) {
      contract = await updateContractStatus(id, body.status);
    }
    
    if (body.notes !== undefined) {
      contract = await updateContractNotes(id, body.notes);
    }
    
    if (body.score !== undefined) {
      contract = await updateContractScore(id, body.score);
    }
    
    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(contract);
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json(
      { error: 'Failed to update contract' },
      { status: 500 }
    );
  }
}
