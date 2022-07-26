import { createAPIClient } from '../../client';
import { Entity, IntegrationStep } from '@jupiterone/integration-sdk-core';
import { IntegrationConfig } from '../../config';
import {
  Entities,
  MappedRelationships,
  Relationships,
  Steps,
} from '../constants';
import {
  createAccountAlertRelationship,
  createAlertFindingEntity,
  createAlertFindingRelationship,
  createAlertFindingToCveRelationship,
} from './converter';
import { ACCOUNT_ENTITY_KEY } from '../account';
import { buildFindingKey } from '../utils';

export async function fetchAlerts({ logger, instance, jobState }) {
  const apiClient = createAPIClient(instance.config, logger);
  const accountEntity = (await jobState.getData(ACCOUNT_ENTITY_KEY)) as Entity;

  await apiClient.iterateAlerts(async (alert) => {
    const alertEntity = createAlertFindingEntity(alert);

    await jobState.addEntity(alertEntity);

    await jobState.addRelationship(
      createAccountAlertRelationship(accountEntity, alertEntity),
    );

    if (alert.findings?.cve && Array.isArray(alert.findings?.cve)) {
      for (const cve of alert.findings.cve) {
        if (cve.cve_id) {
          // alert -> cve
          await jobState.addRelationship(
            createAlertFindingToCveRelationship(alertEntity, cve),
          );

          // alert ?-> finding
          const findingEntity = await jobState.findEntity(
            buildFindingKey(alert.asset_unique_id, cve.cve_id),
          );
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
      MappedRelationships.ALERT_HAS_CVE,
    ],
    dependsOn: [Steps.ACCOUNT, Steps.FINDINGS],
    executionHandler: fetchAlerts,
  },
];
