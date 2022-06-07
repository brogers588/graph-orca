import { RelationshipClass, StepSpec } from '@jupiterone/integration-sdk-core';
import { IntegrationConfig } from '../../../../src/config';

export const accountSpec: StepSpec<IntegrationConfig>[] = [
  {
    /**
     * ENDPOINT: https://api.orcasecurity.io/api/cves
     * PATTERN: Fetch Entities
     */
    id: 'fetch-findings',
    name: 'Fetch Findings',
    entities: [
      {
        resourceName: 'Finding',
        _type: 'orca_finding',
        _class: ['Finding'],
      },
    ],
    relationships: [
      {
        _type: 'orca_asset_has_finding',
        sourceType: 'orca_asset',
        _class: RelationshipClass.HAS,
        targetType: 'orca_finding',
      },
      {
        _type: 'orca_finding_is_cve',
        sourceType: 'orca_finding',
        _class: RelationshipClass.IS,
        targetType: 'orca_cve',
      },
      {
        _type: 'orca_account_has_finding',
        sourceType: 'orca_account',
        _class: RelationshipClass.HAS,
        targetType: 'orca_finding',
      },
    ],
    dependsOn: [],
    implemented: true,
  },
];
