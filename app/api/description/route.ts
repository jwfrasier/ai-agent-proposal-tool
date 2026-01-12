import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const descUrl = searchParams.get('url');

    if (!descUrl) {
      return NextResponse.json(
        { error: 'Description URL is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.SAM_GOV_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'SAM API key not configured' },
        { status: 503 }
      );
    }

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
      return NextResponse.json({ description: 'Description not available' });
    }

    const data = await response.json();

    // SAM.gov returns description in different formats
    const description =
      data.description ||
      data.content ||
      data.data?.description ||
      'Description not available';

    return NextResponse.json({ description });
  } catch (error) {
    console.error('Error fetching description:', error);
    return NextResponse.json({ description: 'Description not available' });
  }
}
