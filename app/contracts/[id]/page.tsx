'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScoreDisplay, ScoreBreakdown } from '@/components/ScoreDisplay';
import {
  ArrowLeft,
  Building2,
  Calendar,
  MapPin,
  ExternalLink,
  User,
  Mail,
  Phone,
  Sparkles,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Save,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import type {
  SavedContract,
  SamOpportunity,
  OpportunityScore,
  CompanyProfile,
} from '@/types';

const statusOptions = [
  { value: 'reviewing', label: 'Reviewing', color: 'bg-slate-500' },
  { value: 'pursuing', label: 'Pursuing', color: 'bg-blue-500' },
  { value: 'submitted', label: 'Submitted', color: 'bg-purple-500' },
  { value: 'won', label: 'Won', color: 'bg-emerald-500' },
  { value: 'lost', label: 'Lost', color: 'bg-red-500' },
  { value: 'no-bid', label: 'No Bid', color: 'bg-slate-400' },
];

export default function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [contract, setContract] = useState<SavedContract | null>(null);
  const [opportunity, setOpportunity] = useState<SamOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<SavedContract['status']>('reviewing');
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

  useEffect(() => {
    fetchContract();
  }, [resolvedParams.id]);

  const fetchContract = async () => {
    try {
      // First try to get saved contract
      const savedResponse = await fetch(`/api/contracts/${resolvedParams.id}`);
      if (savedResponse.ok) {
        const savedData = await savedResponse.json();
        setContract(savedData);
        // Fetch description if it's a URL
        const opp = savedData.opportunity;
        if (opp.description && opp.description.startsWith('http')) {
          opp.description = await fetchDescription(opp.description);
        }
        setOpportunity(opp);
        setNotes(savedData.notes || '');
        setStatus(savedData.status);
      } else {
        // If not saved, try to fetch from SAM.gov
        const samResponse = await fetch(`/api/sam/${resolvedParams.id}`);
        if (samResponse.ok) {
          const samData = await samResponse.json();
          // Fetch description if it's a URL
          if (samData.description && samData.description.startsWith('http')) {
            samData.description = await fetchDescription(samData.description);
          }
          setOpportunity(samData);
        }
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDescription = async (descUrl: string): Promise<string> => {
    try {
      const response = await fetch(
        `/api/description?url=${encodeURIComponent(descUrl)}`
      );
      if (response.ok) {
        const data = await response.json();
        return data.description || 'Description not available';
      }
      return 'Description not available';
    } catch {
      return 'Description not available';
    }
  };

  const handleScore = async () => {
    if (!opportunity) return;
    setScoring(true);
    try {
      const response = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity }),
      });

      if (response.ok) {
        const scoreData: OpportunityScore = await response.json();

        // Save or update the contract with the score
        const saveResponse = await fetch('/api/contracts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: opportunity.noticeId,
            opportunity,
            score: scoreData,
            notes,
            status,
          }),
        });

        if (saveResponse.ok) {
          const savedContract = await saveResponse.json();
          setContract(savedContract);
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to score opportunity');
      }
    } catch (error) {
      console.error('Error scoring:', error);
      alert('Failed to score opportunity');
    } finally {
      setScoring(false);
    }
  };

  const handleSave = async () => {
    if (!opportunity) return;
    setSaving(true);
    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: opportunity.noticeId,
          opportunity,
          score: contract?.score,
          notes,
          status,
        }),
      });

      if (response.ok) {
        const savedContract = await response.json();
        setContract(savedContract);
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: SavedContract['status']) => {
    setStatus(newStatus);
    if (contract) {
      await fetch(`/api/contracts/${contract.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    }
  };

  const handleNotesChange = async (newNotes: string) => {
    setNotes(newNotes);
    if (contract) {
      await fetch(`/api/contracts/${contract.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: newNotes }),
      });
    }
  };

  const handleGeneratePdf = async (
    type: 'capability-statement' | 'opportunity-analysis' | 'proposal-outline'
  ) => {
    setGeneratingPdf(type);
    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          opportunityId: contract?.id || opportunity?.noticeId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const pdfWindow = window.open('', '_blank');
        if (pdfWindow) {
          let htmlContent = '';

          if (type === 'capability-statement') {
            const company = result.data.company;
            htmlContent = generateCapabilityStatementHTML(company);
          } else if (type === 'opportunity-analysis') {
            const { opportunity: opp, score, company } = result.data;
            htmlContent = generateOpportunityAnalysisHTML(opp, score, company);
          } else if (type === 'proposal-outline') {
            const { opportunity: opp, score, company, outline } = result.data;
            htmlContent = generateProposalOutlineHTML(
              opp,
              score,
              company,
              outline
            );
          }

          pdfWindow.document.write(htmlContent);
          pdfWindow.document.close();
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setGeneratingPdf(null);
    }
  };

  // Helper functions for generating styled PDF HTML
  const getPdfStyles = () => `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.6;
    }
    
    .document {
      max-width: 850px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
      color: white;
      padding: 40px;
    }
    
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .header .subtitle {
      font-size: 14px;
      opacity: 0.8;
    }
    
    .header .company-name {
      font-size: 18px;
      color: #fbbf24;
      margin-top: 16px;
    }
    
    .content {
      padding: 40px;
    }
    
    .section {
      margin-bottom: 32px;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding-bottom: 8px;
      border-bottom: 2px solid #3b82f6;
      margin-bottom: 16px;
    }
    
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    
    .info-item {
      margin-bottom: 12px;
    }
    
    .info-label {
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 2px;
    }
    
    .info-value {
      font-size: 14px;
      color: #1e293b;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background: #e2e8f0;
      border-radius: 4px;
      font-size: 12px;
      margin-right: 6px;
      margin-bottom: 6px;
    }
    
    .badge-primary {
      background: #3b82f6;
      color: white;
    }
    
    .badge-success {
      background: #22c55e;
      color: white;
    }
    
    .badge-warning {
      background: #f59e0b;
      color: white;
    }
    
    .badge-danger {
      background: #ef4444;
      color: white;
    }
    
    .score-box {
      display: flex;
      gap: 20px;
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    
    .score-item {
      text-align: center;
      flex: 1;
    }
    
    .score-value {
      font-size: 32px;
      font-weight: 700;
    }
    
    .score-label {
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
    }
    
    .recommendation {
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    
    .recommendation.go {
      background: #dcfce7;
      border-left: 4px solid #22c55e;
    }
    
    .recommendation.no-go {
      background: #fee2e2;
      border-left: 4px solid #ef4444;
    }
    
    .recommendation.consider {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
    }
    
    .recommendation-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .list {
      list-style: none;
      padding: 0;
    }
    
    .list li {
      padding: 8px 0;
      padding-left: 24px;
      position: relative;
    }
    
    .list li::before {
      content: '→';
      position: absolute;
      left: 0;
      color: #3b82f6;
    }
    
    .strengths li::before {
      content: '✓';
      color: #22c55e;
    }
    
    .weaknesses li::before {
      content: '✗';
      color: #ef4444;
    }
    
    .two-column {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    
    .box {
      padding: 16px;
      border-radius: 8px;
    }
    
    .box-green {
      background: #dcfce7;
    }
    
    .box-red {
      background: #fee2e2;
    }
    
    .footer {
      text-align: center;
      padding: 24px;
      background: #f8fafc;
      font-size: 12px;
      color: #64748b;
    }
    
    .outline-section {
      margin-bottom: 24px;
    }
    
    .outline-section h3 {
      font-size: 16px;
      color: #1e3a5f;
      margin-bottom: 12px;
    }
    
    .outline-content {
      white-space: pre-wrap;
      font-size: 14px;
      line-height: 1.8;
    }
    
    @media print {
      body { background: white; }
      .document { box-shadow: none; }
    }
  `;

  const generateCapabilityStatementHTML = (company: CompanyProfile) => `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Capability Statement - ${company.name}</title>
      <style>${getPdfStyles()}</style>
    </head>
    <body>
      <div class="document">
        <div class="header">
          <h1>Capability Statement</h1>
          <div class="subtitle">Federal Contractor Profile</div>
          <div class="company-name">${company.name}</div>
        </div>
        
        <div class="content">
          <div class="section">
            <div class="section-title">Company Information</div>
            <div class="grid">
              <div class="info-item">
                <div class="info-label">UEI</div>
                <div class="info-value">${company.uei}</div>
              </div>
              <div class="info-item">
                <div class="info-label">CAGE Code</div>
                <div class="info-value">${company.cageCode || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Years in Business</div>
                <div class="info-value">${company.yearsInBusiness} years</div>
              </div>
              <div class="info-item">
                <div class="info-label">Employees</div>
                <div class="info-value">${company.employeeCount}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Annual Revenue</div>
                <div class="info-value">${company.annualRevenue}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Hourly Rate</div>
                <div class="info-value">${
                  company.hourlyRate || 'Contact for pricing'
                }</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Contact Information</div>
            <div class="grid">
              <div class="info-item">
                <div class="info-label">Point of Contact</div>
                <div class="info-value">${
                  company.contactInfo.pointOfContact
                }</div>
                <div class="info-value" style="font-size: 12px; color: #64748b;">${
                  company.contactInfo.pocTitle
                }</div>
              </div>
              <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">${company.contactInfo.email}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Phone</div>
                <div class="info-value">${company.contactInfo.phone}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Website</div>
                <div class="info-value">${company.contactInfo.website}</div>
              </div>
              <div class="info-item" style="grid-column: span 2;">
                <div class="info-label">Address</div>
                <div class="info-value">${company.contactInfo.address}, ${
    company.contactInfo.city
  }, ${company.contactInfo.state} ${company.contactInfo.zip}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">NAICS Codes</div>
            <div>${company.naicsCodes
              .map((code) => `<span class="badge">${code}</span>`)
              .join('')}</div>
          </div>
          
          <div class="section">
            <div class="section-title">PSC Codes</div>
            <div>${
              company.pscCodes
                ?.map((code) => `<span class="badge">${code}</span>`)
                .join('') || 'N/A'
            }</div>
          </div>
          
          <div class="section">
            <div class="section-title">Small Business Certifications</div>
            <div>${
              company.smallBusinessTypes
                ?.map(
                  (type) => `<span class="badge badge-primary">${type}</span>`
                )
                .join('') || 'None'
            }</div>
          </div>
          
          <div class="section">
            <div class="section-title">Core Competencies</div>
            <div>${
              company.coreCompetencies
                ?.map((comp) => `<span class="badge">${comp}</span>`)
                .join('') || 'N/A'
            }</div>
          </div>
          
          <div class="section">
            <div class="section-title">Capabilities</div>
            <p style="white-space: pre-wrap;">${company.capabilities}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Key Differentiators</div>
            <p>${company.differentiators}</p>
          </div>
          
          ${
            company.pastPerformance && company.pastPerformance.length > 0
              ? `
          <div class="section">
            <div class="section-title">Past Performance</div>
            ${company.pastPerformance
              .map(
                (pp) => `
              <div style="padding: 16px; background: #f8fafc; border-radius: 8px; margin-bottom: 12px;">
                <div style="font-weight: 600; margin-bottom: 8px;">${
                  pp.projectName || pp.contractName
                }</div>
                <div class="grid">
                  <div class="info-item">
                    <div class="info-label">Client</div>
                    <div class="info-value">${pp.client || pp.agency}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Value</div>
                    <div class="info-value">${pp.value}</div>
                  </div>
                  <div class="info-item" style="grid-column: span 2;">
                    <div class="info-label">Description</div>
                    <div class="info-value">${pp.description}</div>
                  </div>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
          `
              : ''
          }
        </div>
        
        <div class="footer">
          Generated on ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })} | ${company.name} | ${company.contactInfo.website}
        </div>
      </div>
    </body>
    </html>
  `;

  const generateOpportunityAnalysisHTML = (
    opp: SamOpportunity,
    score: OpportunityScore,
    company: CompanyProfile
  ) => `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Opportunity Analysis - ${opp.title}</title>
      <style>${getPdfStyles()}</style>
    </head>
    <body>
      <div class="document">
        <div class="header">
          <h1>Opportunity Analysis</h1>
          <div class="subtitle">${opp.solicitationNumber || opp.noticeId}</div>
          <div class="company-name">${opp.title}</div>
        </div>
        
        <div class="content">
          <div class="score-box">
            <div class="score-item">
              <div class="score-value" style="color: ${
                score.overallScore >= 70
                  ? '#22c55e'
                  : score.overallScore >= 50
                  ? '#f59e0b'
                  : '#ef4444'
              };">${score.overallScore}</div>
              <div class="score-label">Overall Score</div>
            </div>
            <div class="score-item">
              <div class="score-value" style="color: ${
                score.naicsMatch >= 70 ? '#22c55e' : '#f59e0b'
              };">${score.naicsMatch}</div>
              <div class="score-label">NAICS Match</div>
            </div>
            <div class="score-item">
              <div class="score-value" style="color: ${
                score.capabilityMatch >= 70 ? '#22c55e' : '#f59e0b'
              };">${score.capabilityMatch}</div>
              <div class="score-label">Capability</div>
            </div>
            <div class="score-item">
              <div class="score-value" style="color: ${
                score.pastPerformanceRelevance >= 70 ? '#22c55e' : '#f59e0b'
              };">${score.pastPerformanceRelevance}</div>
              <div class="score-label">Past Perf.</div>
            </div>
            <div class="score-item">
              <div class="score-value" style="color: ${
                score.setAsideEligibility >= 70 ? '#22c55e' : '#f59e0b'
              };">${score.setAsideEligibility}</div>
              <div class="score-label">Set-Aside</div>
            </div>
          </div>
          
          <div class="recommendation ${
            score.analysis.bidNoGoBid === 'GO'
              ? 'go'
              : score.analysis.bidNoGoBid === 'NO-GO'
              ? 'no-go'
              : 'consider'
          }">
            <div class="recommendation-title">Recommendation: ${
              score.analysis.bidNoGoBid
            }</div>
            <p>${score.analysis.reasoning}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Opportunity Details</div>
            <div class="grid">
              <div class="info-item">
                <div class="info-label">Agency</div>
                <div class="info-value">${opp.department}</div>
              </div>
              <div class="info-item">
                <div class="info-label">NAICS Code</div>
                <div class="info-value">${opp.naicsCode || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Set-Aside</div>
                <div class="info-value">${
                  opp.typeOfSetAsideDescription || 'None'
                }</div>
              </div>
              <div class="info-item">
                <div class="info-label">Response Deadline</div>
                <div class="info-value">${opp.responseDeadLine || 'N/A'}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Analysis Summary</div>
            <p>${score.analysis.summary}</p>
          </div>
          
          <div class="two-column">
            <div class="section">
              <div class="section-title">Strengths</div>
              <div class="box box-green">
                <ul class="list strengths">
                  ${score.analysis.strengths
                    .map((s) => `<li>${s}</li>`)
                    .join('')}
                </ul>
              </div>
            </div>
            <div class="section">
              <div class="section-title">Weaknesses</div>
              <div class="box box-red">
                <ul class="list weaknesses">
                  ${score.analysis.weaknesses
                    .map((w) => `<li>${w}</li>`)
                    .join('')}
                </ul>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Key Requirements</div>
            <ul class="list">
              ${score.analysis.keyRequirements
                .map((r) => `<li>${r}</li>`)
                .join('')}
            </ul>
          </div>
          
          <div class="section">
            <div class="section-title">Recommended Actions</div>
            <ul class="list">
              ${score.analysis.recommendedActions
                .map((a) => `<li>${a}</li>`)
                .join('')}
            </ul>
          </div>
        </div>
        
        <div class="footer">
          Analysis prepared for ${
            company.name
          } | Generated on ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}
        </div>
      </div>
    </body>
    </html>
  `;

  const generateProposalOutlineHTML = (
    opp: SamOpportunity,
    score: OpportunityScore,
    company: CompanyProfile,
    outline: string
  ) => `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Proposal Outline - ${opp.title}</title>
      <style>${getPdfStyles()}</style>
    </head>
    <body>
      <div class="document">
        <div class="header">
          <h1>Proposal Outline</h1>
          <div class="subtitle">${opp.solicitationNumber || opp.noticeId}</div>
          <div class="company-name">${opp.title}</div>
        </div>
        
        <div class="content">
          <div class="section">
            <div class="section-title">Opportunity Summary</div>
            <div class="grid">
              <div class="info-item">
                <div class="info-label">Agency</div>
                <div class="info-value">${opp.department}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Response Deadline</div>
                <div class="info-value">${opp.responseDeadLine || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">NAICS Code</div>
                <div class="info-value">${opp.naicsCode || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Fit Score</div>
                <div class="info-value"><span class="badge ${
                  score.overallScore >= 70
                    ? 'badge-success'
                    : score.overallScore >= 50
                    ? 'badge-warning'
                    : 'badge-danger'
                }">${score.overallScore}/100</span></div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Proposing Organization</div>
            <div class="grid">
              <div class="info-item">
                <div class="info-label">Company</div>
                <div class="info-value">${company.name}</div>
              </div>
              <div class="info-item">
                <div class="info-label">UEI</div>
                <div class="info-value">${company.uei}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Point of Contact</div>
                <div class="info-value">${
                  company.contactInfo.pointOfContact
                }</div>
              </div>
              <div class="info-item">
                <div class="info-label">Contact Email</div>
                <div class="info-value">${company.contactInfo.email}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">AI-Generated Proposal Structure</div>
            <div class="outline-content">${outline
              .replace(/\n/g, '<br>')
              .replace(/#{1,3}\s/g, '<strong>')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Key Points to Emphasize</div>
            <ul class="list strengths">
              ${score.analysis.strengths.map((s) => `<li>${s}</li>`).join('')}
            </ul>
          </div>
          
          <div class="section">
            <div class="section-title">Areas to Address</div>
            <ul class="list">
              ${score.analysis.weaknesses.map((w) => `<li>${w}</li>`).join('')}
            </ul>
          </div>
        </div>
        
        <div class="footer">
          Proposal outline prepared for ${
            company.name
          } | Generated on ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}
        </div>
      </div>
    </body>
    </html>
  `;

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Contract not found</p>
              <Link href="/">
                <Button className="mt-4">Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const score = contract?.score;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant="outline">
                {opportunity.type || 'Opportunity'}
              </Badge>
              {opportunity.typeOfSetAsideDescription && (
                <Badge variant="secondary">
                  {opportunity.typeOfSetAsideDescription}
                </Badge>
              )}
              {opportunity.naicsCode && (
                <Badge variant="outline" className="font-mono">
                  NAICS: {opportunity.naicsCode}
                </Badge>
              )}
              {contract && (
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-32 h-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {opportunity.title}
            </h1>
            {opportunity.solicitationNumber && (
              <p className="text-muted-foreground font-mono mt-1">
                {opportunity.solicitationNumber}
              </p>
            )}
          </div>
          {score && (
            <ScoreDisplay score={score.overallScore} size="lg" showLabel />
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="details">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="analysis" disabled={!score}>
                  AI Analysis
                </TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6 mt-6">
                {/* Agency Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Agency Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground">
                        Department
                      </Label>
                      <p className="font-medium">{opportunity.department}</p>
                    </div>
                    {opportunity.subTier && (
                      <div>
                        <Label className="text-muted-foreground">
                          Sub-Tier Agency
                        </Label>
                        <p className="font-medium">{opportunity.subTier}</p>
                      </div>
                    )}
                    {opportunity.office && (
                      <div>
                        <Label className="text-muted-foreground">Office</Label>
                        <p className="font-medium">{opportunity.office}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">
                        Posted Date
                      </Label>
                      <p className="font-medium">
                        {formatDate(opportunity.postedDate)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Response Deadline
                      </Label>
                      <p className="font-medium text-primary">
                        {formatDate(opportunity.responseDeadLine)}
                      </p>
                    </div>
                    {opportunity.archiveDate && (
                      <div>
                        <Label className="text-muted-foreground">
                          Archive Date
                        </Label>
                        <p className="font-medium">
                          {formatDate(opportunity.archiveDate)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Place of Performance */}
                {opportunity.placeOfPerformance && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Place of Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>
                        {opportunity.placeOfPerformance.streetAddress && (
                          <>
                            {opportunity.placeOfPerformance.streetAddress}
                            <br />
                          </>
                        )}
                        {opportunity.placeOfPerformance.city?.name}
                        {opportunity.placeOfPerformance.city?.name &&
                          opportunity.placeOfPerformance.state?.name &&
                          ', '}
                        {opportunity.placeOfPerformance.state?.name}
                        {opportunity.placeOfPerformance.zip &&
                          ` ${opportunity.placeOfPerformance.zip}`}
                        {opportunity.placeOfPerformance.country?.name && (
                          <>
                            <br />
                            {opportunity.placeOfPerformance.country.name}
                          </>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="whitespace-pre-wrap">
                        {opportunity.description || 'No description available'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Point of Contact */}
                {opportunity.pointOfContact &&
                  opportunity.pointOfContact.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Point of Contact
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {opportunity.pointOfContact.map((poc, idx) => (
                          <div key={idx} className="space-y-2">
                            <p className="font-medium">{poc.fullName}</p>
                            {poc.title && (
                              <p className="text-sm text-muted-foreground">
                                {poc.title}
                              </p>
                            )}
                            {poc.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4" />
                                <a
                                  href={`mailto:${poc.email}`}
                                  className="text-primary hover:underline"
                                >
                                  {poc.email}
                                </a>
                              </div>
                            )}
                            {poc.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4" />
                                <a
                                  href={`tel:${poc.phone}`}
                                  className="text-primary hover:underline"
                                >
                                  {poc.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
              </TabsContent>

              <TabsContent value="analysis" className="space-y-6 mt-6">
                {score && (
                  <>
                    {/* Score Breakdown */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Score Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScoreBreakdown
                          scores={[
                            { label: 'NAICS Match', value: score.naicsMatch },
                            {
                              label: 'Capability Match',
                              value: score.capabilityMatch,
                            },
                            {
                              label: 'Past Performance Relevance',
                              value: score.pastPerformanceRelevance,
                            },
                            {
                              label: 'Set-Aside Eligibility',
                              value: score.setAsideEligibility,
                            },
                          ]}
                        />
                      </CardContent>
                    </Card>

                    {/* Bid Decision */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {score.analysis.bidNoGoBid === 'GO' && (
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                          )}
                          {score.analysis.bidNoGoBid === 'NO-GO' && (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          {score.analysis.bidNoGoBid === 'CONSIDER' && (
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                          )}
                          Recommendation: {score.analysis.bidNoGoBid}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          {score.analysis.reasoning}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Analysis Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>{score.analysis.summary}</p>
                      </CardContent>
                    </Card>

                    {/* Strengths & Weaknesses */}
                    <div className="grid gap-6 md:grid-cols-2">
                      <Card className="border-l-4 border-l-emerald-500">
                        <CardHeader>
                          <CardTitle className="text-emerald-600">
                            Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {score.analysis.strengths.map((s, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-red-500">
                        <CardHeader>
                          <CardTitle className="text-red-600">
                            Weaknesses
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {score.analysis.weaknesses.map((w, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <XCircle className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />
                                <span>{w}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Key Requirements */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Key Requirements Identified</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="grid gap-2 md:grid-cols-2">
                          {score.analysis.keyRequirements.map((r, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">
                                {i + 1}
                              </span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Recommended Actions */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recommended Actions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {score.analysis.recommendedActions.map((a, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary">→</span>
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Relevant Past Performance */}
                    {score.analysis.relevantPastPerformance.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Relevant Past Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {score.analysis.relevantPastPerformance.map(
                              (p, i) => (
                                <li key={i} className="p-3 bg-muted rounded-lg">
                                  {p}
                                </li>
                              )
                            )}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="documents" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Generate Documents
                    </CardTitle>
                    <CardDescription>
                      Generate PDF documents based on this opportunity and your
                      company profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-auto py-4"
                      onClick={() => handleGeneratePdf('capability-statement')}
                      disabled={generatingPdf !== null}
                    >
                      {generatingPdf === 'capability-statement' ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Download className="h-5 w-5" />
                      )}
                      <div className="text-left">
                        <div className="font-medium">Capability Statement</div>
                        <div className="text-sm text-muted-foreground">
                          Company overview and qualifications
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-auto py-4"
                      onClick={() => handleGeneratePdf('opportunity-analysis')}
                      disabled={generatingPdf !== null || !score}
                    >
                      {generatingPdf === 'opportunity-analysis' ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Download className="h-5 w-5" />
                      )}
                      <div className="text-left">
                        <div className="font-medium">Opportunity Analysis</div>
                        <div className="text-sm text-muted-foreground">
                          {score
                            ? 'Detailed fit analysis and scoring'
                            : 'Score opportunity first'}
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-auto py-4"
                      onClick={() => handleGeneratePdf('proposal-outline')}
                      disabled={generatingPdf !== null || !score}
                    >
                      {generatingPdf === 'proposal-outline' ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Download className="h-5 w-5" />
                      )}
                      <div className="text-left">
                        <div className="font-medium">Proposal Outline</div>
                        <div className="text-sm text-muted-foreground">
                          {score
                            ? 'AI-generated proposal structure'
                            : 'Score opportunity first'}
                        </div>
                      </div>
                    </Button>
                  </CardContent>
                </Card>

                {/* External Links */}
                {opportunity.uiLink && (
                  <Card>
                    <CardHeader>
                      <CardTitle>External Resources</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="outline"
                        asChild
                        className="w-full justify-start"
                      >
                        <a
                          href={opportunity.uiLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View on SAM.gov
                        </a>
                      </Button>
                      {opportunity.resourceLinks?.map((link, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          asChild
                          className="w-full justify-start"
                        >
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Resource {i + 1}
                          </a>
                        </Button>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions Card */}
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full gap-2"
                  onClick={handleScore}
                  disabled={scoring}
                >
                  {scoring ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {scoring
                    ? 'Analyzing...'
                    : score
                    ? 'Re-Score with AI'
                    : 'Score with AI'}
                </Button>

                {!contract && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save to Dashboard
                  </Button>
                )}

                <Separator />

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={(e) => handleNotesChange(e.target.value)}
                    placeholder="Add your notes about this opportunity..."
                    rows={5}
                  />
                </div>

                {contract && (
                  <p className="text-xs text-muted-foreground">
                    Last updated:{' '}
                    {new Date(contract.updatedAt).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
