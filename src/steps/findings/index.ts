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
  createFindingCveRelationship,
  createFindingEntity,
} from './converter';

export async function fetchCVEs({
  logger,
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config, logger);
  const accountEntity = (await jobState.getData(ACCOUNT_ENTITY_KEY)) as Entity;

  await apiClient.iterateCVEs(async (cve) => {
    const findingEntity = createFindingEntity(cve);

    if (jobState.hasKey(findingEntity._key)) {
      // Occasionally we see duplicate findings when iterating.
      return;
    }

    await jobState.addEntity(findingEntity);

    await jobState.addRelationships([
      // Account -HAS-> Finding
      createAccountFindingRelationship(accountEntity, findingEntity),
      // Finding -IS-> CVE (mapped)
      createFindingCveRelationship(findingEntity, cve),
    ]);
  });
}

export const findingSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: Steps.FINDINGS,
    name: 'Fetch Findings',
    entities: [Entities.FINDING],
    relationships: [
      Relationships.ACCOUNT_HAS_FINDING,
      MappedRelationships.FINDING_IS_CVE,
    ],
    dependsOn: [Steps.ACCOUNT],
    executionHandler: fetchCVEs,
  },
];
