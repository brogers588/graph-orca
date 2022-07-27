import { createAPIClient } from '../../client';
import { Entity, IntegrationStep } from '@jupiterone/integration-sdk-core';
import { IntegrationConfig } from '../../config';
import { Entities, Relationships, Steps } from '../constants';
import {
  createAccountAlertRelationship,
  createAlertFindingEntity,
} from './converter';
import { ACCOUNT_ENTITY_KEY } from '../account';

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
      logger.warn(
        { alertId: alert.state.alert_id, cve: alert.findings.cve },
        'An unexpected cve was found in an Orca Alert findings. Vulns should be filtered out.',
      );
    }
  });
}

export const alertSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: Steps.ALERTS,
    name: 'Fetch Alerts',
    entities: [Entities.ALERT],
    relationships: [Relationships.ACCOUNT_HAS_FINDING_ALERT],
    dependsOn: [Steps.ACCOUNT],
    executionHandler: fetchAlerts,
  },
];
