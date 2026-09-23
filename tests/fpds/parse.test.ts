import { describe, expect, it } from 'vitest';
import { parseFpdsEntries, summarizeAwards } from '../../lib/fpds/parse';

const xml = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">
<entry><title><![CDATA[New PURCHASE ORDER 1305M326P0344 awarded to VALINOR LABS, LLC for the amount of $28,665]]></title>
<content><ns1:award><ns1:awardID><ns1:awardContractID><ns1:PIID>1305M326P0344</ns1:PIID></ns1:awardContractID></ns1:awardID>
<ns1:relevantContractDates><ns1:signedDate>2026-09-17 00:00:00</ns1:signedDate></ns1:relevantContractDates>
<ns1:dollarValues><ns1:obligatedAmount>28665.00</ns1:obligatedAmount><ns1:baseAndAllOptionsValue>28665.00</ns1:baseAndAllOptionsValue></ns1:dollarValues>
<ns1:contractData><ns1:descriptionOfContractRequirement>SENIOR C++ PROGRAMMER TO MODIFY THE COMPASS MODEL</ns1:descriptionOfContractRequirement></ns1:contractData>
<ns1:vendor><ns1:vendorHeader><ns1:vendorName>VALINOR LABS, LLC</ns1:vendorName></ns1:vendorHeader></ns1:vendor>
<ns1:competition><ns1:extentCompeted description="FULL AND OPEN COMPETITION">A</ns1:extentCompeted><ns1:typeOfSetAside description="SMALL BUSINESS SET ASIDE - TOTAL">SBA</ns1:typeOfSetAside><ns1:numberOfOffersReceived>4</ns1:numberOfOffersReceived></ns1:competition>
<ns1:purchaserInformation><ns1:contractingOfficeName>NOAA WESTERN ACQUISITION</ns1:contractingOfficeName></ns1:purchaserInformation>
<ns1:productOrServiceInformation><ns1:principalNAICSCode description="CUSTOM COMPUTER PROGRAMMING SERVICES">541511</ns1:principalNAICSCode></ns1:productOrServiceInformation>
</ns1:award></content></entry>
<entry><title><![CDATA[PURCHASE ORDER 1305M224F0065 (P00001) awarded to RAYTHEON COMPANY, was modified for the amount of $0]]></title>
<content><ns1:award><ns1:awardID><ns1:awardContractID><ns1:PIID>1305M224F0065</ns1:PIID></ns1:awardContractID></ns1:awardID>
<ns1:relevantContractDates><ns1:signedDate>2026-09-10 00:00:00</ns1:signedDate></ns1:relevantContractDates>
<ns1:dollarValues><ns1:obligatedAmount>0.00</ns1:obligatedAmount><ns1:baseAndAllOptionsValue>0.00</ns1:baseAndAllOptionsValue></ns1:dollarValues>
<ns1:vendor><ns1:vendorHeader><ns1:vendorName>RAYTHEON COMPANY</ns1:vendorName></ns1:vendorHeader></ns1:vendor>
</ns1:award></content></entry>
<entry><title><![CDATA[New DELIVERY ORDER 75D30126F0001 awarded to ACME LLC for the amount of $250,000]]></title>
<content><ns1:award><ns1:awardID><ns1:awardContractID><ns1:PIID>75D30126F0001</ns1:PIID></ns1:awardContractID></ns1:awardID>
<ns1:relevantContractDates><ns1:signedDate>2026-06-01 00:00:00</ns1:signedDate></ns1:relevantContractDates>
<ns1:dollarValues><ns1:obligatedAmount>250000.00</ns1:obligatedAmount><ns1:baseAndAllOptionsValue>400000.00</ns1:baseAndAllOptionsValue></ns1:dollarValues>
<ns1:vendor><ns1:vendorHeader><ns1:vendorName>ACME LLC</ns1:vendorName></ns1:vendorHeader></ns1:vendor>
<ns1:competition><ns1:typeOfSetAside description="NO SET ASIDE USED.">NONE</ns1:typeOfSetAside><ns1:numberOfOffersReceived>1</ns1:numberOfOffersReceived></ns1:competition>
</ns1:award></content></entry>
</feed>`;

describe('parseFpdsEntries', () => {
  it('extracts one record per entry with the fields pricing needs', () => {
    const rows = parseFpdsEntries(xml);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      piid: '1305M326P0344', vendor: 'VALINOR LABS, LLC', signed: '2026-09-17',
      obligated: 28665, total: 28665, isNewAward: true, offers: 4,
      setAside: 'SMALL BUSINESS SET ASIDE - TOTAL', competed: 'FULL AND OPEN COMPETITION',
      office: 'NOAA WESTERN ACQUISITION', naics: '541511',
    });
    expect(rows[0].description).toContain('C++');
    expect(rows[1].isNewAward).toBe(false);
  });
});

describe('summarizeAwards', () => {
  it('reports the distribution of NEW awards only, with the under-SAT share', () => {
    const s = summarizeAwards(parseFpdsEntries(xml));
    expect(s.newAwards).toBe(2);
    expect(s.mods).toBe(1);
    expect(s.p50).toBe(214332.5); // median of 28,665 and 400,000 (total value)
    expect(s.underSatShare).toBe(0.5);
    expect(s.medianOffers).toBe(2.5);
    expect(s.setAsides['SMALL BUSINESS SET ASIDE - TOTAL']).toBe(1);
  });
});
