import { OrcaAlertCVE, OrcaCVE } from '../types';

export function buildFindingKey(assetId: string, cveId: string) {
  return `${assetId}:${cveId}`;
}

export function extractCVSS(cve: OrcaCVE | OrcaAlertCVE): {
  score: number;
  vector: string;
} {
  return cve.nvd.cvss3_score
    ? {
        score: cve.nvd.cvss3_score,
        vector: cve.nvd.cvss3_vector,
      }
    : {
        score: cve.nvd.cvss2_score,
        vector: cve.nvd.cvss2_vector,
      };
}
