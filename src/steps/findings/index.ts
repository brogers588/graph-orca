import {
  Entity,
  IntegrationStep,
  IntegrationStepExecutionContext,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../../client';
import { IntegrationConfig } from '../../config';
import { ACCOUNT_ENTITY_KEY } from '../account';
import {
  Entities,
  Steps,
  Relationships,
  MappedRelationships,
} from '../constants';
import {
  createAccountFindingRelationship,
  createAssetFindingRelationship,
  createFindingCveRelationship,
  createFindingEntity,
} from './converter';

export async function fetchCVEs({
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);
  const accountEntity = (await jobState.getData(ACCOUNT_ENTITY_KEY)) as Entity;

  await apiClient.iterateCVEs(async (cve) => {
    const findingEntity = await jobState.addEntity(createFindingEntity(cve));

    await jobState.addRelationships([
      // Account -HAS-> Finding
      createAccountFindingRelationship(accountEntity, findingEntity),
      // Finding -IS-> CVE (mapped)
      createFindingCveRelationship(findingEntity, cve),
    ]);

    const assetEntity = await jobState.findEntity(cve.asset_unique_id);
    if (assetEntity) {
      // Asset -HAS-> Finding
      await jobState.addRelationship(
        createAssetFindingRelationship(assetEntity, findingEntity),
      );
    }
  });
}

export const findingSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: Steps.FINDINGS,
    name: 'Fetch Findings',
    entities: [Entities.FINDING],
    relationships: [
      Relationships.ACCOUNT_HAS_FINDING,
      Relationships.ASSET_HAS_FINDING,
      MappedRelationships.FINDING_IS_CVE,
    ],
    dependsOn: [Steps.ACCOUNT, Steps.ASSETS],
    executionHandler: fetchCVEs,
  },
];
