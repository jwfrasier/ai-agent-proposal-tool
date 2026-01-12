import { NextRequest, NextResponse } from 'next/server';
import { getCompanyProfile, getSavedContract } from '@/lib/storage';
import { generateProposalOutline } from '@/lib/openai';
import {
  generateCapabilityStatementData,
  generateOpportunityAnalysisData,
  generateProposalOutlineData,
} from '@/lib/pdf-generator';
import type { PDFType } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pdfType: PDFType = body.type;
    const opportunityId: string | undefined = body.opportunityId;
    
    // Get company profile (required for all PDF types)
    const company = await getCompanyProfile();
    
    if (!company) {
      return NextResponse.json(
        { error: 'Company profile required', message: 'Please set up your company profile first' },
        { status: 400 }
      );
    }
    
    switch (pdfType) {
      case 'capability-statement': {
        const data = generateCapabilityStatementData(company);
        return NextResponse.json({ type: pdfType, data });
      }
      
      case 'opportunity-analysis': {
        if (!opportunityId) {
          return NextResponse.json(
            { error: 'Opportunity ID required for analysis PDF' },
            { status: 400 }
          );
        }
        
        const savedContract = await getSavedContract(opportunityId);
        
        if (!savedContract) {
          return NextResponse.json(
            { error: 'Saved contract not found' },
            { status: 404 }
          );
        }
        
        if (!savedContract.score) {
          return NextResponse.json(
            { error: 'Opportunity must be scored before generating analysis PDF' },
            { status: 400 }
          );
        }
        
        const data = generateOpportunityAnalysisData(
          savedContract.opportunity,
          savedContract.score,
          company
        );
        return NextResponse.json({ type: pdfType, data });
      }
      
      case 'proposal-outline': {
        if (!opportunityId) {
          return NextResponse.json(
            { error: 'Opportunity ID required for proposal outline' },
            { status: 400 }
          );
        }
        
        const savedContract = await getSavedContract(opportunityId);
        
        if (!savedContract) {
          return NextResponse.json(
            { error: 'Saved contract not found' },
            { status: 404 }
          );
        }
        
        if (!savedContract.score) {
          return NextResponse.json(
            { error: 'Opportunity must be scored before generating proposal outline' },
            { status: 400 }
          );
        }
        
        // Generate proposal outline using AI
        const outline = await generateProposalOutline(
          savedContract.opportunity,
          company,
          savedContract.score
        );
        
        const data = generateProposalOutlineData(
          savedContract.opportunity,
          savedContract.score,
          company,
          outline
        );
        return NextResponse.json({ type: pdfType, data });
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid PDF type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error generating PDF data:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF data' },
      { status: 500 }
    );
  }
}
