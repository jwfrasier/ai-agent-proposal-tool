import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import { marked, type Tokens } from 'marked';
import React from 'react';

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: 'Helvetica', lineHeight: 1.4 },
  h1: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  h2: { fontSize: 16, fontWeight: 'bold', marginTop: 12, marginBottom: 6 },
  h3: { fontSize: 13, fontWeight: 'bold', marginTop: 10, marginBottom: 4 },
  p: { marginBottom: 6 },
  li: { marginLeft: 12, marginBottom: 2 },
  table: { marginBottom: 8 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#ccc', paddingVertical: 3 },
  th: { flex: 1, fontWeight: 'bold', paddingHorizontal: 4 },
  td: { flex: 1, paddingHorizontal: 4 },
  hr: { borderBottomWidth: 0.5, borderColor: '#999', marginVertical: 8 },
  code: { fontFamily: 'Courier', fontSize: 10, backgroundColor: '#f4f4f4', padding: 4, marginBottom: 6 },
});

function renderInline(text: string): string {
  // Strip simple inline markdown markers — react-pdf inline mixed fonts are heavy work,
  // and SAT-level docs read fine as plain text.
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1');
}

function renderToken(token: Tokens.Generic, key: number): React.ReactNode {
  switch (token.type) {
    case 'heading': {
      const t = token as Tokens.Heading;
      const style = t.depth === 1 ? styles.h1 : t.depth === 2 ? styles.h2 : styles.h3;
      return React.createElement(Text, { key, style }, renderInline(t.text));
    }
    case 'paragraph':
      return React.createElement(Text, { key, style: styles.p }, renderInline((token as Tokens.Paragraph).text));
    case 'list': {
      const t = token as Tokens.List;
      return React.createElement(
        View,
        { key },
        t.items.map((item, i) =>
          React.createElement(Text, { key: i, style: styles.li }, `• ${renderInline(item.text)}`),
        ),
      );
    }
    case 'table': {
      const t = token as Tokens.Table;
      const headerRow = React.createElement(
        View,
        { key: 'h', style: styles.tr },
        t.header.map((cell, i) =>
          React.createElement(Text, { key: i, style: styles.th }, renderInline(cell.text)),
        ),
      );
      const bodyRows = t.rows.map((row, ri) =>
        React.createElement(
          View,
          { key: ri, style: styles.tr },
          row.map((cell, ci) =>
            React.createElement(Text, { key: ci, style: styles.td }, renderInline(cell.text)),
          ),
        ),
      );
      return React.createElement(View, { key, style: styles.table }, headerRow, ...bodyRows);
    }
    case 'hr':
      return React.createElement(View, { key, style: styles.hr });
    case 'code':
      return React.createElement(Text, { key, style: styles.code }, (token as Tokens.Code).text);
    case 'space':
      return null;
    default:
      return React.createElement(
        Text,
        { key, style: styles.p },
        renderInline(((token as { raw?: string }).raw) ?? ''),
      );
  }
}

export async function renderMarkdownToPdf(markdown: string): Promise<Buffer> {
  const tokens = marked.lexer(markdown);
  const children = tokens.map((t, i) => renderToken(t, i));
  const doc = React.createElement(
    Document,
    null,
    React.createElement(Page, { size: 'LETTER', style: styles.page }, ...children),
  );
  return renderToBuffer(doc);
}
