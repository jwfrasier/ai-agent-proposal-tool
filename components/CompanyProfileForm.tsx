'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, X, Save, Building2, FileText, Award, Users } from 'lucide-react';
import type { CompanyProfile, PastPerformance, ContactInfo } from '@/types';

interface CompanyProfileFormProps {
  initialData: CompanyProfile | null;
  onSave: (profile: CompanyProfile) => Promise<void>;
}

const smallBusinessOptions = [
  '8(a)',
  'HUBZone',
  'WOSB',
  'EDWOSB',
  'SDVOSB',
  'VOSB',
  'SDB',
  'Small Business',
];

export function CompanyProfileForm({ initialData, onSave }: CompanyProfileFormProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<CompanyProfile>>(
    initialData || {
      name: '',
      uei: '',
      cageCode: '',
      naicsCodes: [],
      pscCodes: [],
      capabilities: '',
      pastPerformance: [],
      certifications: [],
      smallBusinessTypes: [],
      contactInfo: {
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        email: '',
        website: '',
        pointOfContact: '',
        pocTitle: '',
      },
      coreCompetencies: [],
      differentiators: '',
      yearsInBusiness: 0,
      annualRevenue: '',
      employeeCount: 0,
    }
  );

  const [newNaics, setNewNaics] = useState('');
  const [newPsc, setNewPsc] = useState('');
  const [newCert, setNewCert] = useState('');
  const [newCompetency, setNewCompetency] = useState('');

  const handleInputChange = (field: keyof CompanyProfile, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleContactChange = (field: keyof ContactInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      contactInfo: { ...prev.contactInfo!, [field]: value },
    }));
  };

  const addToArray = (
    field: 'naicsCodes' | 'pscCodes' | 'certifications' | 'coreCompetencies',
    value: string,
    setter: (v: string) => void
  ) => {
    if (!value.trim()) return;
    const current = formData[field] || [];
    if (!current.includes(value.trim())) {
      setFormData(prev => ({ ...prev, [field]: [...current, value.trim()] }));
    }
    setter('');
  };

  const removeFromArray = (
    field: 'naicsCodes' | 'pscCodes' | 'certifications' | 'coreCompetencies' | 'smallBusinessTypes',
    value: string
  ) => {
    const current = formData[field] || [];
    setFormData(prev => ({ ...prev, [field]: current.filter(v => v !== value) }));
  };

  const toggleSmallBusiness = (type: string) => {
    const current = formData.smallBusinessTypes || [];
    if (current.includes(type)) {
      setFormData(prev => ({
        ...prev,
        smallBusinessTypes: current.filter(t => t !== type),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        smallBusinessTypes: [...current, type],
      }));
    }
  };

  const addPastPerformance = () => {
    const newPP: PastPerformance = {
      id: crypto.randomUUID(),
      contractName: '',
      agency: '',
      contractNumber: '',
      value: '',
      period: '',
      description: '',
      relevantNaics: [],
    };
    setFormData(prev => ({
      ...prev,
      pastPerformance: [...(prev.pastPerformance || []), newPP],
    }));
  };

  const updatePastPerformance = (id: string, field: keyof PastPerformance, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      pastPerformance: prev.pastPerformance?.map(pp =>
        pp.id === id ? { ...pp, [field]: value } : pp
      ),
    }));
  };

  const removePastPerformance = (id: string) => {
    setFormData(prev => ({
      ...prev,
      pastPerformance: prev.pastPerformance?.filter(pp => pp.id !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData as CompanyProfile);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-600" />
            Company Information
          </CardTitle>
          <CardDescription>Basic company details and identifiers</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={e => handleInputChange('name', e.target.value)}
              placeholder="Your Company Name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uei">UEI (Unique Entity Identifier) *</Label>
            <Input
              id="uei"
              value={formData.uei || ''}
              onChange={e => handleInputChange('uei', e.target.value)}
              placeholder="12-character UEI"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cageCode">CAGE Code</Label>
            <Input
              id="cageCode"
              value={formData.cageCode || ''}
              onChange={e => handleInputChange('cageCode', e.target.value)}
              placeholder="5-character CAGE code"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearsInBusiness">Years in Business</Label>
            <Input
              id="yearsInBusiness"
              type="number"
              value={formData.yearsInBusiness || ''}
              onChange={e => handleInputChange('yearsInBusiness', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employeeCount">Employee Count</Label>
            <Input
              id="employeeCount"
              type="number"
              value={formData.employeeCount || ''}
              onChange={e => handleInputChange('employeeCount', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="annualRevenue">Annual Revenue</Label>
            <Input
              id="annualRevenue"
              value={formData.annualRevenue || ''}
              onChange={e => handleInputChange('annualRevenue', e.target.value)}
              placeholder="e.g., $5M - $10M"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly Rate</Label>
            <Input
              id="hourlyRate"
              value={formData.hourlyRate || ''}
              onChange={e => handleInputChange('hourlyRate', e.target.value)}
              placeholder="e.g., $150/hr"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Contact Information
          </CardTitle>
          <CardDescription>Primary contact and location details</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="poc">Point of Contact</Label>
            <Input
              id="poc"
              value={formData.contactInfo?.pointOfContact || ''}
              onChange={e => handleContactChange('pointOfContact', e.target.value)}
              placeholder="Full Name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pocTitle">POC Title</Label>
            <Input
              id="pocTitle"
              value={formData.contactInfo?.pocTitle || ''}
              onChange={e => handleContactChange('pocTitle', e.target.value)}
              placeholder="e.g., CEO, Business Development"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.contactInfo?.email || ''}
              onChange={e => handleContactChange('email', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.contactInfo?.phone || ''}
              onChange={e => handleContactChange('phone', e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.contactInfo?.address || ''}
              onChange={e => handleContactChange('address', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.contactInfo?.city || ''}
              onChange={e => handleContactChange('city', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.contactInfo?.state || ''}
                onChange={e => handleContactChange('state', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP</Label>
              <Input
                id="zip"
                value={formData.contactInfo?.zip || ''}
                onChange={e => handleContactChange('zip', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.contactInfo?.website || ''}
              onChange={e => handleContactChange('website', e.target.value)}
              placeholder="https://"
            />
          </div>
        </CardContent>
      </Card>

      {/* NAICS & PSC Codes */}
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            Classification Codes
          </CardTitle>
          <CardDescription>NAICS and PSC codes your company is registered for</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>NAICS Codes</Label>
            <div className="flex gap-2">
              <Input
                value={newNaics}
                onChange={e => setNewNaics(e.target.value)}
                placeholder="Enter NAICS code"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('naicsCodes', newNaics, setNewNaics);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addToArray('naicsCodes', newNaics, setNewNaics)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.naicsCodes?.map(code => (
                <Badge key={code} variant="secondary" className="gap-1">
                  {code}
                  <button type="button" onClick={() => removeFromArray('naicsCodes', code)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>PSC (Product Service Codes)</Label>
            <div className="flex gap-2">
              <Input
                value={newPsc}
                onChange={e => setNewPsc(e.target.value)}
                placeholder="Enter PSC code"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('pscCodes', newPsc, setNewPsc);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addToArray('pscCodes', newPsc, setNewPsc)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.pscCodes?.map(code => (
                <Badge key={code} variant="secondary" className="gap-1">
                  {code}
                  <button type="button" onClick={() => removeFromArray('pscCodes', code)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Small Business & Certifications */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" />
            Certifications & Set-Asides
          </CardTitle>
          <CardDescription>Small business designations and certifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Small Business Designations</Label>
            <div className="flex flex-wrap gap-2">
              {smallBusinessOptions.map(type => (
                <Badge
                  key={type}
                  variant={formData.smallBusinessTypes?.includes(type) ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors"
                  onClick={() => toggleSmallBusiness(type)}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Other Certifications</Label>
            <div className="flex gap-2">
              <Input
                value={newCert}
                onChange={e => setNewCert(e.target.value)}
                placeholder="e.g., ISO 9001, CMMI Level 3"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('certifications', newCert, setNewCert);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addToArray('certifications', newCert, setNewCert)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.certifications?.map(cert => (
                <Badge key={cert} variant="secondary" className="gap-1">
                  {cert}
                  <button type="button" onClick={() => removeFromArray('certifications', cert)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capabilities */}
      <Card className="border-l-4 border-l-rose-500">
        <CardHeader>
          <CardTitle>Capabilities & Differentiators</CardTitle>
          <CardDescription>Describe what your company does and what makes you unique</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Core Competencies</Label>
            <div className="flex gap-2">
              <Input
                value={newCompetency}
                onChange={e => setNewCompetency(e.target.value)}
                placeholder="Add a core competency"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('coreCompetencies', newCompetency, setNewCompetency);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addToArray('coreCompetencies', newCompetency, setNewCompetency)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.coreCompetencies?.map(comp => (
                <Badge key={comp} variant="secondary" className="gap-1">
                  {comp}
                  <button type="button" onClick={() => removeFromArray('coreCompetencies', comp)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capabilities">Capabilities Statement</Label>
            <Textarea
              id="capabilities"
              value={formData.capabilities || ''}
              onChange={e => handleInputChange('capabilities', e.target.value)}
              placeholder="Describe your company's capabilities, services, and expertise..."
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="differentiators">Key Differentiators</Label>
            <Textarea
              id="differentiators"
              value={formData.differentiators || ''}
              onChange={e => handleInputChange('differentiators', e.target.value)}
              placeholder="What sets your company apart from competitors?"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Past Performance */}
      <Card className="border-l-4 border-l-cyan-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Past Performance</span>
            <Button type="button" variant="outline" size="sm" onClick={addPastPerformance}>
              <Plus className="h-4 w-4 mr-2" />
              Add Contract
            </Button>
          </CardTitle>
          <CardDescription>Previous government and relevant commercial contracts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {formData.pastPerformance?.map((pp, index) => (
            <div key={pp.id} className="p-4 border rounded-lg space-y-4 relative bg-muted/30">
              <button
                type="button"
                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                onClick={() => removePastPerformance(pp.id)}
              >
                <X className="h-4 w-4" />
              </button>
              <div className="font-medium text-sm text-muted-foreground">Contract #{index + 1}</div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Contract Name</Label>
                  <Input
                    value={pp.contractName}
                    onChange={e => updatePastPerformance(pp.id, 'contractName', e.target.value)}
                    placeholder="Contract title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Agency</Label>
                  <Input
                    value={pp.agency}
                    onChange={e => updatePastPerformance(pp.id, 'agency', e.target.value)}
                    placeholder="Contracting agency"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contract Number</Label>
                  <Input
                    value={pp.contractNumber}
                    onChange={e => updatePastPerformance(pp.id, 'contractNumber', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contract Value</Label>
                  <Input
                    value={pp.value}
                    onChange={e => updatePastPerformance(pp.id, 'value', e.target.value)}
                    placeholder="e.g., $500,000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Period of Performance</Label>
                  <Input
                    value={pp.period}
                    onChange={e => updatePastPerformance(pp.id, 'period', e.target.value)}
                    placeholder="e.g., 2020-2023"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Relevant NAICS</Label>
                  <Input
                    value={pp.relevantNaics?.join(', ') || ''}
                    onChange={e =>
                      updatePastPerformance(
                        pp.id,
                        'relevantNaics',
                        e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      )
                    }
                    placeholder="Comma-separated NAICS codes"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={pp.description}
                  onChange={e => updatePastPerformance(pp.id, 'description', e.target.value)}
                  placeholder="Brief description of work performed..."
                  rows={3}
                />
              </div>
            </div>
          ))}
          {(!formData.pastPerformance || formData.pastPerformance.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No past performance entries yet. Click &quot;Add Contract&quot; to add one.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button type="submit" size="lg" disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </form>
  );
}
