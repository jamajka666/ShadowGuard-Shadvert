import { AdCheckResult } from '../types';

export function exportHistoryToCsv(history: AdCheckResult[]) {
  if (!history || history.length === 0) return;

  // Header row
  const headers = [
    'Datum a čas',
    'Úroveň rizika',
    'Skóre důvěry (%)',
    'Výsledek / Titulek',
    'Odkaz / Doména / Text',
    'Poučení pro tátu',
    'Doporučení',
    'Rizikové faktory',
  ];

  const escapeCsv = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = history.map((item) => {
    const dateTime = new Date(item.timestamp).toLocaleString('cs-CZ');
    const safetyText =
      item.safetyLevel === 'PODVOD'
        ? 'PODVOD (Vysoké riziko)'
        : item.safetyLevel === 'OPATRNOSTI'
        ? 'OPATRNOST (Zvýšené riziko)'
        : 'BEZPEČNÉ (Důvěryhodné)';
    const trustScore = `${item.trustScore}%`;
    const headline = item.headline || '';
    const linkOrText =
      item.inputUrl || item.urlAnalysis?.domainName || item.inputSnippet || '';
    const summary = item.summaryForSenior || '';
    const recommendation = item.actionRecommendation || '';
    const risks = (item.riskFactors || []).map((rf) => rf.title).join('; ');

    return [
      escapeCsv(dateTime),
      escapeCsv(safetyText),
      escapeCsv(trustScore),
      escapeCsv(headline),
      escapeCsv(linkOrText),
      escapeCsv(summary),
      escapeCsv(recommendation),
      escapeCsv(risks),
    ].join(';');
  });

  // UTF-8 BOM for Excel / mobile viewers compatibility with Czech accents
  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const fileName = `strazce_inzeratu_historie_${new Date().toISOString().slice(0, 10)}.csv`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
