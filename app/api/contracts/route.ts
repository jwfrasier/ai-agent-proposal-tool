import { NextRequest, NextResponse } from 'next/server';
import { getSavedContracts, saveContract, deleteSavedContract } from '@/lib/storage';
import type { SavedContract } from '@/types';

export async function GET() {
  try {
    const contracts = await getSavedContracts();
    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Error fetching saved contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved contracts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.opportunity) {
      return NextResponse.json(
        { error: 'Opportunity data is required' },
        { status: 400 }
      );
    }
    
    const contract: SavedContract = {
      id: body.id || body.opportunity.noticeId,
      opportunity: body.opportunity,
      score: body.score || undefined,
      notes: body.notes || '',
      status: body.status || 'reviewing',
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const saved = await saveContract(contract);
    
    return NextResponse.json(saved);
  } catch (error) {
    console.error('Error saving contract:', error);
    return NextResponse.json(
      { error: 'Failed to save contract' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Contract ID is required' },
        { status: 400 }
      );
    }
    
    const success = await deleteSavedContract(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json(
      { error: 'Failed to delete contract' },
      { status: 500 }
    );
  }
}
