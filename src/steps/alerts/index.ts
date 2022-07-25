import { createAPIClient } from '../../client';
import { Entity, IntegrationStep } from '@jupiterone/integration-sdk-core';
import { IntegrationConfig } from '../../config';
import { Entities, Relationships, Steps } from '../constants';
import {
  createAccountAlertRelationship,
  createAlertFindingEntity,
  createAlertFindingRelationship,
} from './converter';
import { ACCOUNT_ENTITY_KEY } from '../account';

export async function fetchAlerts({ logger, instance, jobState }) {
  const apiClient = createAPIClient(instance.config, logger);
  const accountEntity = (await jobState.getData(ACCOUNT_ENTITY_KEY)) as Entity;

  await apiClient.iterateAlerts(async (alert) => {
    const alertEntity = createAlertFindingEntity(
      alert,
      instance.config.clientBaseUrl,
    );

    await jobState.addEntity(alertEntity);

    await jobState.addRelationship(
      createAccountAlertRelationship(accountEntity, alertEntity),
    );

    if (alert.findings?.cve && Array.isArray(alert.findings?.cve)) {
      for (const cve of alert.findings.cve) {
        if (cve.cve_id) {
          const findingKey = `${alert.asset_unique_id}:${cve.cve_id}`;
          const findingEntity = await jobState.findEntity(findingKey);

          if (findingEntity) {
            await jobState.addRelationship(
              createAlertFindingRelationship(alertEntity, findingEntity),
            );
          }
        }
      }
    }
  });
}

export const alertSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: Steps.ALERTS,
    name: 'Fetch Alerts',
    entities: [Entities.ALERT],
    relationships: [
      Relationships.ACCOUNT_HAS_ALERT,
      Relationships.ALERT_HAS_FINDING,
    ],
    dependsOn: [Steps.FINDINGS],
    executionHandler: fetchAlerts,
  },
];
