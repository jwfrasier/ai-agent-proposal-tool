'use client';

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { CompanyProfile, SamOpportunity, OpportunityScore } from '@/types';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 15,
  },
  scoreBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 4,
    marginBottom: 20,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
  },
  scoreLabel: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
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
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: 120,
    fontSize: 9,
    color: '#64748b',
  },
  value: {
    flex: 1,
    fontSize: 10,
  },
  recommendation: {
    padding: 15,
    borderRadius: 4,
    marginBottom: 15,
  },
  recommendationGo: {
    backgroundColor: '#dcfce7',
    borderLeft: '4 solid #22c55e',
  },
  recommendationNoGo: {
    backgroundColor: '#fee2e2',
    borderLeft: '4 solid #ef4444',
  },
  recommendationConsider: {
    backgroundColor: '#fef3c7',
    borderLeft: '4 solid #eab308',
  },
  recommendationTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  list: {
    marginLeft: 10,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    width: 15,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 20,
  },
  column: {
    flex: 1,
  },
  strengthBox: {
    backgroundColor: '#dcfce7',
    padding: 10,
    borderRadius: 4,
  },
  weaknessBox: {
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: 4,
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

interface OpportunityAnalysisPDFProps {
  opportunity: SamOpportunity;
  score: OpportunityScore;
  company: CompanyProfile;
}

export function OpportunityAnalysisPDF({ opportunity, score, company }: OpportunityAnalysisPDFProps) {
  const getRecommendationStyle = () => {
    switch (score.analysis.bidNoGoBid) {
      case 'GO': return styles.recommendationGo;
      case 'NO-GO': return styles.recommendationNoGo;
      default: return styles.recommendationConsider;
    }
  };

  const getScoreColor = (value: number) => {
    if (value >= 80) return '#22c55e';
    if (value >= 60) return '#eab308';
    if (value >= 40) return '#f97316';
    return '#ef4444';
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Opportunity Analysis</Text>
          <Text style={styles.subtitle}>{opportunity.title}</Text>
        </View>

        {/* Score Overview */}
        <View style={styles.scoreBox}>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreValue, { color: getScoreColor(score.overallScore) }]}>
              {score.overallScore}
            </Text>
            <Text style={styles.scoreLabel}>Overall Score</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreValue, { color: getScoreColor(score.naicsMatch) }]}>
              {score.naicsMatch}
            </Text>
            <Text style={styles.scoreLabel}>NAICS Match</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreValue, { color: getScoreColor(score.capabilityMatch) }]}>
              {score.capabilityMatch}
            </Text>
            <Text style={styles.scoreLabel}>Capability</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreValue, { color: getScoreColor(score.pastPerformanceRelevance) }]}>
              {score.pastPerformanceRelevance}
            </Text>
            <Text style={styles.scoreLabel}>Past Perf.</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreValue, { color: getScoreColor(score.setAsideEligibility) }]}>
              {score.setAsideEligibility}
            </Text>
            <Text style={styles.scoreLabel}>Set-Aside</Text>
          </View>
        </View>

        {/* Recommendation */}
        <View style={[styles.recommendation, getRecommendationStyle()]}>
          <Text style={styles.recommendationTitle}>
            Recommendation: {score.analysis.bidNoGoBid}
          </Text>
          <Text>{score.analysis.reasoning}</Text>
        </View>

        {/* Opportunity Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opportunity Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Solicitation #:</Text>
            <Text style={styles.value}>{opportunity.solicitationNumber || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Agency:</Text>
            <Text style={styles.value}>{opportunity.department}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>NAICS Code:</Text>
            <Text style={styles.value}>{opportunity.naicsCode || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Set-Aside:</Text>
            <Text style={styles.value}>{opportunity.typeOfSetAsideDescription || 'None'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Response Due:</Text>
            <Text style={styles.value}>{opportunity.responseDeadLine || 'N/A'}</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analysis Summary</Text>
          <Text>{score.analysis.summary}</Text>
        </View>

        {/* Strengths & Weaknesses */}
        <View style={[styles.section, styles.twoColumn]}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Strengths</Text>
            <View style={styles.strengthBox}>
              {score.analysis.strengths.map((s, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.bullet}>✓</Text>
                  <Text>{s}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Weaknesses</Text>
            <View style={styles.weaknessBox}>
              {score.analysis.weaknesses.map((w, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.bullet}>✗</Text>
                  <Text>{w}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Key Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Requirements</Text>
          <View style={styles.list}>
            {score.analysis.keyRequirements.map((r, i) => (
              <View key={i} style={styles.listItem}>
                <Text style={styles.bullet}>{i + 1}.</Text>
                <Text>{r}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recommended Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Actions</Text>
          <View style={styles.list}>
            {score.analysis.recommendedActions.map((a, i) => (
              <View key={i} style={styles.listItem}>
                <Text style={styles.bullet}>→</Text>
                <Text>{a}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Analysis prepared for {company.name} | Generated on {new Date().toLocaleDateString()}
        </Text>
      </Page>
    </Document>
  );
}
