import {
  Entity,
  IntegrationStep,
  IntegrationStepExecutionContext,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../../client';
import { IntegrationConfig } from '../../config';
import { ACCOUNT_ENTITY_KEY } from '../account';
import { Entities, Steps, Relationships } from '../constants';
import { createAccountAssetRelationship, createAssetEntity } from './converter';

export async function fetchAssets({
  logger,
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config, logger);

  const accountEntity = (await jobState.getData(ACCOUNT_ENTITY_KEY)) as Entity;

  await apiClient.iterateAssets(async (asset) => {
    const assetEntity = await jobState.addEntity(createAssetEntity(asset));

    await jobState.addRelationship(
      createAccountAssetRelationship(accountEntity, assetEntity),
    );
  });
}

export const assetSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: Steps.ASSETS,
    name: 'Fetch Assets',
    entities: [Entities.ASSET],
    relationships: [Relationships.ACCOUNT_HAS_ASSET],
    dependsOn: [Steps.ACCOUNT],
    executionHandler: fetchAssets,
  },
];
