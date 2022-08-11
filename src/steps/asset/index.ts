import {
  Entity,
  getRawData,
  IntegrationMissingKeyError,
  IntegrationStep,
  IntegrationStepExecutionContext,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../../client';
import { IntegrationConfig } from '../../config';
import { OrcaAsset } from '../../types';
import { ACCOUNT_ENTITY_KEY } from '../account';
import { Entities, Steps, Relationships } from '../constants';
import { createAssetFindingRelationship } from '../findings/converter';
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

export async function buildAssetHasFinding({
  logger,
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  await jobState.iterateEntities(
    { _type: Entities.FINDING._type },
    async (findingEntity) => {
      const finding = getRawData<OrcaAsset>(findingEntity);

      if (!finding) {
        logger.warn(
          { _key: findingEntity._key },
          'Could not get raw data for finding entity',
        );
        return;
      }

      if (finding.asset_unique_id) {
        const assetEntity = await jobState.findEntity(finding.asset_unique_id);

        if (assetEntity) {
          await jobState.addRelationship(
            createAssetFindingRelationship(assetEntity, findingEntity),
          );
        }
      }
    },
  );
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
  {
    id: Steps.ASSET_HAS_FINDING_RELATIONSHIPS,
    name: 'Build Asset Has Finding',
    entities: [],
    relationships: [Relationships.ASSET_HAS_FINDING],
    dependsOn: [Steps.ASSETS, Steps.FINDINGS],
    executionHandler: buildAssetHasFinding,
  },
];
