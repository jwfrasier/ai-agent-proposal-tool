# GovContracts Dashboard

A Next.js application for searching, analyzing, and managing federal government contract opportunities from SAM.gov with AI-powered scoring and PDF generation.

## Features

- **Contract Search**: Search SAM.gov federal opportunities by keyword, NAICS code, set-aside type, and date ranges
- **Company Profile**: Configure your company's capabilities, certifications, and past performance
- **AI-Powered Scoring**: Analyze opportunities against your company profile using OpenAI GPT-4
- **Opportunity Management**: Save, track, and manage opportunities through their lifecycle
- **PDF Generation**: Generate capability statements, opportunity analyses, and proposal outlines

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- SAM.gov API Key (free registration at [SAM.gov](https://sam.gov))
- OpenAI API Key (from [OpenAI Platform](https://platform.openai.com))

### Installation

1. Clone the repository:
```bash
cd govcontracts-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your API keys:
```env
OPENAI_API_KEY=your_openai_api_key_here
SAM_GOV_API_KEY=your_sam_gov_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Getting API Keys

### SAM.gov API Key

1. Go to [SAM.gov](https://sam.gov)
2. Create an account or sign in
3. Navigate to your account settings
4. Request an API key from the API section
5. The key will be emailed to you (may take a few days)

### OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create an account or sign in
3. Navigate to API Keys
4. Create a new secret key
5. Copy and save the key securely

## Usage

### 1. Set Up Company Profile

Before scoring opportunities, configure your company profile:

- Navigate to the Company Profile page
- Enter your company details (UEI, CAGE code, NAICS codes)
- Add your capabilities and past performance
- Select relevant small business certifications
- Save your profile

### 2. Search Opportunities

Use the search interface to find relevant contracts:

- Enter keywords related to your services
- Filter by NAICS code for targeted results
- Select set-aside types matching your certifications
- Use date filters for recent opportunities

### 3. Score & Analyze

Select interesting opportunities and use AI scoring:

- Click "AI Score" on any opportunity
- Review the detailed analysis including:
  - Overall fit score (0-100)
  - NAICS code match
  - Capability alignment
  - Past performance relevance
  - Set-aside eligibility
  - GO/NO-GO recommendation

### 4. Generate Documents

Create submission-ready documents:

- **Capability Statement**: Company overview PDF
- **Opportunity Analysis**: Detailed scoring report
- **Proposal Outline**: AI-generated proposal structure

## Project Structure

```
govcontracts-dashboard/
├── app/
│   ├── page.tsx                 # Dashboard home
│   ├── company/page.tsx         # Company profile editor
│   ├── contracts/[id]/page.tsx  # Contract detail view
│   └── api/
│       ├── company/route.ts     # Company profile API
│       ├── sam/route.ts         # SAM.gov proxy
│       ├── score/route.ts       # AI scoring
│       ├── contracts/route.ts   # Saved contracts
│       └── pdf/route.ts         # PDF generation
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── ContractCard.tsx
│   ├── ScoreDisplay.tsx
│   ├── SearchFilters.tsx
│   ├── CompanyProfileForm.tsx
│   └── PDFTemplates/
├── lib/
│   ├── sam-api.ts               # SAM.gov API client
│   ├── openai.ts                # OpenAI integration
│   ├── pdf-generator.ts         # PDF utilities
│   ├── storage.ts               # JSON file operations
│   └── utils.ts
├── data/                        # Local JSON storage
│   ├── company-profile.json
│   └── saved-contracts.json
└── types/
    └── index.ts                 # TypeScript types
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **AI**: OpenAI GPT-4
- **PDF**: @react-pdf/renderer
- **Icons**: Lucide React
- **Data**: SAM.gov Public API

## Data Storage

This application uses local JSON files for data storage:

- `data/company-profile.json` - Your company profile
- `data/saved-contracts.json` - Saved opportunities and scores

For production use, consider migrating to a proper database.

## License

MIT License - See LICENSE file for details.

## Disclaimer

This application is not affiliated with SAM.gov or any government agency. Always verify opportunity details on the official SAM.gov website before submitting proposals.
