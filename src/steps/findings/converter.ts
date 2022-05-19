import {
  createIntegrationEntity,
  createDirectRelationship,
  Entity,
  RelationshipClass,
  Relationship,
  createMappedRelationship,
  RelationshipDirection,
} from '@jupiterone/integration-sdk-core';

import { Entities } from '../constants';
import { OrcaCVE } from '../../types';

function extractCVSS(cve: OrcaCVE): {
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

export function createFindingEntity(cve: OrcaCVE): Entity {
  const { score, vector } = extractCVSS(cve);
  const fixAvailable = cve.fix_available_state.toLowerCase() === 'yes';

  return createIntegrationEntity({
    entityData: {
      source: cve,
      assign: {
        _type: Entities.FINDING._type,
        _class: Entities.FINDING._class,
        _key: `${cve.asset_unique_id}:${cve.cve_id}`,
        name: cve.cve_id,
        score: score ?? cve.score,
        vector,
        category: cve.labels ? cve.labels[0] : 'unknown',
        numericSeverity: score ?? cve.score,
        open: !fixAvailable,
        severity: cve.severity,
        references: cve.vendor_source_link
          ? [cve.vendor_source_link]
          : undefined,
        isFixAvailable: fixAvailable === true,
      },
    },
  });
}

export function createAssetFindingRelationship(
  asset: Entity,
  finding: Entity,
): Relationship {
  return createDirectRelationship({
    _class: RelationshipClass.HAS,
    from: asset,
    to: finding,
  });
}

export function createAccountFindingRelationship(
  account: Entity,
  finding: Entity,
): Relationship {
  return createDirectRelationship({
    _class: RelationshipClass.HAS,
    from: account,
    to: finding,
  });
}

export function createFindingCveRelationship(
  finding: Entity,
  cveId: string,
): Relationship {
  return createMappedRelationship({
    _class: RelationshipClass.IS,
    _type: 'orca_finding_is_cve',
    _mapping: {
      sourceEntityKey: finding._key,
      relationshipDirection: RelationshipDirection.FORWARD,
      skipTargetCreation: false,
      targetFilterKeys: [['_type', '_key']],
      targetEntity: {
        _key: cveId,
        _type: 'cve',
        id: cveId,
        webLink: `https://nvd.nist.gov/vuln/detail/${cveId}`,
      },
    },
  });
}
