import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const SAM_CACHE_FILE = path.join(process.cwd(), 'data', 'sam-cache.json');
    
    // Read cache file
    const cacheData = await fs.readFile(SAM_CACHE_FILE, 'utf-8');
    const cache = JSON.parse(cacheData);
    
    // Extract all opportunities from all cached searches and deduplicate
    const opportunitiesMap = new Map();
    
    for (const cached of cache) {
      if (cached.data?.opportunitiesData) {
        for (const opp of cached.data.opportunitiesData) {
          if (!opportunitiesMap.has(opp.noticeId)) {
            opportunitiesMap.set(opp.noticeId, opp);
          }
        }
      }
    }
    
    const opportunities = Array.from(opportunitiesMap.values());
    
    // Convert to CSV
    const csvLines: string[] = [];
    
    // CSV Headers
    const headers = [
      'Notice ID',
      'Solicitation Number',
      'Title',
      'Type',
      'Department',
      'Sub-Tier',
      'Office',
      'NAICS Code',
      'Set-Aside Type',
      'Set-Aside Description',
      'Posted Date',
      'Response Deadline',
      'Archive Date',
      'Active',
      'City',
      'State',
      'ZIP Code',
      'Primary Contact Name',
      'Primary Contact Email',
      'Primary Contact Phone',
      'Description Preview',
      'SAM.gov Link',
    ];
    
    csvLines.push(headers.map(h => `"${h}"`).join(','));
    
    // CSV Data Rows
    for (const opp of opportunities) {
      const row = [
        opp.noticeId || '',
        opp.solicitationNumber || '',
        opp.title || '',
        opp.type || '',
        opp.department || '',
        opp.subTier || '',
        opp.office || '',
        opp.naicsCode || '',
        opp.typeOfSetAside || '',
        opp.typeOfSetAsideDescription || '',
        opp.postedDate || '',
        opp.responseDeadLine || '',
        opp.archiveDate || '',
        opp.active || '',
        opp.placeOfPerformance?.city?.name || opp.officeAddress?.city || '',
        opp.placeOfPerformance?.state?.name || opp.officeAddress?.state || '',
        opp.placeOfPerformance?.zip || opp.officeAddress?.zipcode || '',
        opp.pointOfContact?.[0]?.fullName || '',
        opp.pointOfContact?.[0]?.email || '',
        opp.pointOfContact?.[0]?.phone || '',
        // Description preview (first 200 chars, cleaned)
        typeof opp.description === 'string' 
          ? opp.description.substring(0, 200).replace(/[\n\r]+/g, ' ').replace(/"/g, '""')
          : '',
        opp.uiLink || `https://sam.gov/opp/${opp.noticeId}`,
      ];
      
      // Escape quotes and wrap each field in quotes
      const escapedRow = row.map(field => {
        const cleaned = String(field).replace(/"/g, '""');
        return `"${cleaned}"`;
      });
      
      csvLines.push(escapedRow.join(','));
    }
    
    const csv = csvLines.join('\n');
    
    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="sam-gov-opportunities-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
    
  } catch (error) {
    console.error('Error exporting cache to CSV:', error);
    return NextResponse.json(
      { error: 'Failed to export cache', message: (error as Error).message },
      { status: 500 }
    );
  }
}
