import type { SamOpportunity, SearchParams, SamApiResponse } from '@/types';

const SAM_API_BASE = 'https://api.sam.gov/opportunities/v2';

export async function searchOpportunities(
  params: SearchParams
): Promise<SamApiResponse> {
  const apiKey = process.env.SAM_GOV_API_KEY;

  if (!apiKey) {
    throw new Error('SAM_GOV_API_KEY environment variable is not set');
  }

  const queryParams = new URLSearchParams();
  queryParams.append('api_key', apiKey);

  if (params.keyword) {
    queryParams.append('keyword', params.keyword);
  }

  if (params.naicsCode) {
    queryParams.append('naics', params.naicsCode);
  }

  if (params.typeOfSetAside) {
    queryParams.append('typeOfSetAside', params.typeOfSetAside);
  }

  // SAM.gov requires postedFrom and postedTo - default to last 90 days
  const today = new Date();
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(today.getDate() - 90);

  const formatDate = (d: Date) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  queryParams.append(
    'postedFrom',
    params.postedFrom || formatDate(ninetyDaysAgo)
  );
  queryParams.append('postedTo', params.postedTo || formatDate(today));

  if (params.responseDeadlineFrom) {
    queryParams.append('rdlfrom', params.responseDeadlineFrom);
  }

  if (params.responseDeadlineTo) {
    queryParams.append('rdlto', params.responseDeadlineTo);
  }

  queryParams.append('limit', String(params.limit || 25));
  queryParams.append('offset', String(params.offset || 0));

  // Only get active opportunities by default
  queryParams.append('ptype', 'o,p,k'); // Opportunities, Pre-solicitations, Combined

  const url = `${SAM_API_BASE}/search?${queryParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SAM.gov API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return {
    totalRecords: data.totalRecords || 0,
    limit: data.limit || params.limit || 25,
    offset: data.offset || params.offset || 0,
    opportunitiesData: data.opportunitiesData || [],
  };
}

export async function getOpportunityById(
  noticeId: string
): Promise<SamOpportunity | null> {
  const apiKey = process.env.SAM_GOV_API_KEY;

  if (!apiKey) {
    throw new Error('SAM_GOV_API_KEY environment variable is not set');
  }

  const url = `${SAM_API_BASE}/search?api_key=${apiKey}&noticeid=${noticeId}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`SAM.gov API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.opportunitiesData && data.opportunitiesData.length > 0) {
    const opportunity = data.opportunitiesData[0];
    // Fetch the full description if it's a URL
    if (opportunity.description && opportunity.description.startsWith('http')) {
      opportunity.description = await fetchDescription(
        opportunity.description,
        apiKey
      );
    }
    return opportunity;
  }

  return null;
}

// Fetch the actual description content from the SAM.gov description API
async function fetchDescription(
  descUrl: string,
  apiKey: string
): Promise<string> {
  try {
    // Add API key to the description URL
    const urlWithKey = descUrl.includes('?')
      ? `${descUrl}&api_key=${apiKey}`
      : `${descUrl}?api_key=${apiKey}`;

    const response = await fetch(urlWithKey, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return 'Description not available';
    }

    const data = await response.json();
    // The description API returns the content in a 'description' field
    return data.description || data.content || 'Description not available';
  } catch (error) {
    console.error('Error fetching description:', error);
    return 'Description not available';
  }
}

// Helper to enrich opportunities with full descriptions
export async function enrichOpportunityDescription(
  opportunity: SamOpportunity
): Promise<SamOpportunity> {
  const apiKey = process.env.SAM_GOV_API_KEY;
  if (!apiKey) return opportunity;

  if (opportunity.description && opportunity.description.startsWith('http')) {
    opportunity.description = await fetchDescription(
      opportunity.description,
      apiKey
    );
  }
  return opportunity;
}

// Set-aside type options
export const setAsideTypes = [
  { value: '', label: 'All Set-Asides' },
  { value: 'SBA', label: 'Total Small Business Set-Aside' },
  { value: 'SBP', label: 'Partial Small Business Set-Aside' },
  { value: '8A', label: '8(a) Set-Aside' },
  { value: '8AN', label: '8(a) Sole Source' },
  { value: 'HZC', label: 'HUBZone Set-Aside' },
  { value: 'HZS', label: 'HUBZone Sole Source' },
  { value: 'SDVOSBC', label: 'Service-Disabled Veteran-Owned SB Set-Aside' },
  { value: 'SDVOSBS', label: 'Service-Disabled Veteran-Owned SB Sole Source' },
  { value: 'WOSB', label: 'Women-Owned Small Business Set-Aside' },
  { value: 'WOSBSS', label: 'Women-Owned Small Business Sole Source' },
  { value: 'EDWOSB', label: 'Economically Disadvantaged WOSB Set-Aside' },
  { value: 'EDWOSBSS', label: 'Economically Disadvantaged WOSB Sole Source' },
  { value: 'LAS', label: 'Local Area Set-Aside' },
  { value: 'IEE', label: 'Indian Economic Enterprise Set-Aside' },
  {
    value: 'ISBEE',
    label: 'Indian Small Business Economic Enterprise Set-Aside',
  },
  { value: 'BICiv', label: 'Buy Indian Set-Aside' },
  { value: 'VSA', label: 'Veteran-Owned Small Business Set-Aside' },
  { value: 'VSS', label: 'Veteran-Owned Small Business Sole Source' },
];

// Common NAICS codes for reference
export const commonNaicsCodes = [
  { code: '541511', description: 'Custom Computer Programming Services' },
  { code: '541512', description: 'Computer Systems Design Services' },
  { code: '541519', description: 'Other Computer Related Services' },
  { code: '541611', description: 'Administrative Management Consulting' },
  { code: '541612', description: 'Human Resources Consulting' },
  { code: '541613', description: 'Marketing Consulting' },
  {
    code: '541614',
    description: 'Process/Physical Distribution/Logistics Consulting',
  },
  { code: '541618', description: 'Other Management Consulting' },
  { code: '541690', description: 'Other Scientific and Technical Consulting' },
  { code: '541990', description: 'All Other Professional Services' },
  { code: '561110', description: 'Office Administrative Services' },
  { code: '561210', description: 'Facilities Support Services' },
  { code: '561320', description: 'Temporary Help Services' },
  { code: '561499', description: 'All Other Business Support Services' },
  {
    code: '611430',
    description: 'Professional and Management Development Training',
  },
  {
    code: '236220',
    description: 'Commercial and Institutional Building Construction',
  },
  { code: '237310', description: 'Highway, Street, and Bridge Construction' },
  { code: '238210', description: 'Electrical Contractors' },
  {
    code: '238220',
    description: 'Plumbing, Heating, and Air-Conditioning Contractors',
  },
  { code: '517311', description: 'Wired Telecommunications Carriers' },
  { code: '518210', description: 'Data Processing and Hosting Services' },
];
