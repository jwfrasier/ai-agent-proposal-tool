import { describe, it, expect } from 'vitest';
import { screenOpportunity } from '@/lib/screening/screen';

describe('screenOpportunity', () => {
  it('auto-passes Justification / Award notices (already decided)', () => {
    const r = screenOpportunity({ noticeType: 'Justification', title: 'AI Assistant Tools', description: 'See attached justification' });
    expect(r.disposition).toBe('auto_pass');
    expect(r.category).toBe('already_decided');
    expect(r.signals[0]!.matched).toContain('Justification');
  });

  it('auto-passes brand-name / sole-source buys (the GovDelivery case)', () => {
    const r = screenOpportunity({
      noticeType: 'Sources Sought',
      title: 'GovDelivery Digital Communication Management Tool',
      description: 'NPS has a requirement to procure the brand-name GovDelivery platform, manufactured by Granicus through Carahsoft. Annual Subscription. GovDelivery satisfies these salient characteristics.',
    });
    expect(r.disposition).toBe('auto_pass');
    expect(['brand_name_sole_source', 'commodity_license']).toContain(r.category);
    // explainable: a cited phrase is present
    expect(r.signals.some((s) => /brand[\s-]?name/i.test(s.matched))).toBe(true);
    expect(r.signals.some((s) => s.category === 'commodity_license')).toBe(true);
  });

  it('flags (not auto-passes) a named-COTS product RFI (the ABMC DAM case)', () => {
    const r = screenOpportunity({
      noticeType: 'Sources Sought',
      title: 'Digital Asset Management Platform',
      description: 'ABMC seeks proven DAM platforms that can be configured without excessive custom development such as Alfresco, Preservica, Nuxeo.',
    });
    expect(r.disposition).toBe('flag');
    expect(r.category).toBe('product_rfi');
  });

  it('auto-passes obvious non-IT scope', () => {
    const r = screenOpportunity({ noticeType: 'Solicitation', title: 'Nurse Call Server and Software', description: 'Responder 5 nurse call system installation.' });
    expect(r.disposition).toBe('auto_pass');
    expect(r.category).toBe('out_of_scope');
  });

  it('clears a genuine services solicitation (the SSS website case)', () => {
    const r = screenOpportunity({
      noticeType: 'Solicitation',
      title: 'Selective Service System Website Modernization',
      description: 'Redesign and modernize the public website using a modern CMS, USWDS, Section 508 accessibility, and content migration.',
    });
    expect(r.disposition).toBe('clear');
    expect(r.category).toBeNull();
    expect(r.signals).toHaveLength(0);
  });
});
