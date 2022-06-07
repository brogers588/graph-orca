import { RelationshipClass, StepSpec } from '@jupiterone/integration-sdk-core';
import { IntegrationConfig } from '../../../../src/config';

export const accountSpec: StepSpec<IntegrationConfig>[] = [
  {
    /**
     * ENDPOINT: https://api.orcasecurity.io/api/assets
     * PATTERN: Fetch Entities
     */
    id: 'fetch-assets',
    name: 'Fetch Assets',
    entities: [
      {
        resourceName: 'Asset',
        _type: 'orca_asset',
        _class: ['Resource'],
      },
    ],
    relationships: [
      {
        _type: 'orca_account_has_asset',
        sourceType: 'orca_account',
        _class: RelationshipClass.HAS,
        targetType: 'orca_asset',
      },
    ],
    dependsOn: [],
    implemented: true,
  },
];
