'use client';

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { CompanyProfile } from '@/types';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #1e3a5f',
    paddingBottom: 15,
  },
  companyName: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 11,
    color: '#64748b',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: '1 solid #e2e8f0',
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 20,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#e2e8f0',
    padding: '3 8',
    borderRadius: 4,
    fontSize: 9,
    marginRight: 5,
    marginBottom: 5,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  competencyItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    width: 15,
    color: '#2563eb',
  },
  pastPerformance: {
    backgroundColor: '#f8fafc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 4,
  },
  ppTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    marginBottom: 4,
  },
  ppDetail: {
    fontSize: 9,
    color: '#64748b',
  },
  contactSection: {
    backgroundColor: '#1e3a5f',
    color: 'white',
    padding: 15,
    marginTop: 20,
    borderRadius: 4,
  },
  contactTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    marginBottom: 10,
  },
  contactInfo: {
    fontSize: 9,
    marginBottom: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
  },
});

interface CapabilityStatementPDFProps {
  company: CompanyProfile;
}

export function CapabilityStatementPDF({ company }: CapabilityStatementPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{company.name}</Text>
          <Text style={styles.tagline}>
            {company.coreCompetencies?.slice(0, 3).join(' | ')}
          </Text>
        </View>

        {/* Company Info */}
        <View style={[styles.section, styles.twoColumn]}>
          <View style={styles.column}>
            <Text style={styles.label}>UEI</Text>
            <Text style={styles.value}>{company.uei}</Text>
            <Text style={styles.label}>CAGE Code</Text>
            <Text style={styles.value}>{company.cageCode || 'N/A'}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Years in Business</Text>
            <Text style={styles.value}>{company.yearsInBusiness} years</Text>
            <Text style={styles.label}>Employees</Text>
            <Text style={styles.value}>{company.employeeCount}</Text>
          </View>
        </View>

        {/* NAICS Codes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NAICS Codes</Text>
          <View style={styles.badgeContainer}>
            {company.naicsCodes?.map((code, i) => (
              <Text key={i} style={styles.badge}>{code}</Text>
            ))}
          </View>
        </View>

        {/* Small Business Certifications */}
        {company.smallBusinessTypes && company.smallBusinessTypes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Small Business Certifications</Text>
            <View style={styles.badgeContainer}>
              {company.smallBusinessTypes.map((type, i) => (
                <Text key={i} style={styles.badge}>{type}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Core Competencies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Core Competencies</Text>
          {company.coreCompetencies?.map((comp, i) => (
            <View key={i} style={styles.competencyItem}>
              <Text style={styles.bullet}>•</Text>
              <Text>{comp}</Text>
            </View>
          ))}
        </View>

        {/* Capabilities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Capabilities Overview</Text>
          <Text>{company.capabilities}</Text>
        </View>

        {/* Differentiators */}
        {company.differentiators && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Differentiators</Text>
            <Text>{company.differentiators}</Text>
          </View>
        )}

        {/* Past Performance */}
        {company.pastPerformance && company.pastPerformance.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past Performance</Text>
            {company.pastPerformance.slice(0, 3).map((pp, i) => (
              <View key={i} style={styles.pastPerformance}>
                <Text style={styles.ppTitle}>{pp.contractName}</Text>
                <Text style={styles.ppDetail}>Agency: {pp.agency}</Text>
                <Text style={styles.ppDetail}>Value: {pp.value} | Period: {pp.period}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Contact Information</Text>
          <Text style={styles.contactInfo}>
            {company.contactInfo?.pointOfContact}
            {company.contactInfo?.pocTitle && `, ${company.contactInfo.pocTitle}`}
          </Text>
          <Text style={styles.contactInfo}>
            {company.contactInfo?.address}
          </Text>
          <Text style={styles.contactInfo}>
            {company.contactInfo?.city}, {company.contactInfo?.state} {company.contactInfo?.zip}
          </Text>
          <Text style={styles.contactInfo}>
            Phone: {company.contactInfo?.phone} | Email: {company.contactInfo?.email}
          </Text>
          {company.contactInfo?.website && (
            <Text style={styles.contactInfo}>Web: {company.contactInfo.website}</Text>
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Generated on {new Date().toLocaleDateString()} | Capability Statement | {company.name}
        </Text>
      </Page>
    </Document>
  );
}
