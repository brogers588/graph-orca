import { IntegrationConfig } from './config';
import { IntegrationExecutionContext } from '@jupiterone/integration-sdk-core';
import { Steps } from './steps/constants';

export default function getStepStartStates(
  context: IntegrationExecutionContext<IntegrationConfig>,
) {
  const { config } = context.instance;

  const enableAssetIngestion =
    config.enableAssetIngestion || process.env.ENABLE_ASSET_INGESTION;

  return {
    [Steps.ACCOUNT]: { disabled: false },
    [Steps.USERS]: { disabled: false },
    [Steps.GROUPS]: { disabled: false },
    [Steps.ROLES]: { disabled: false },
    [Steps.ASSETS]: { disabled: !enableAssetIngestion },
    [Steps.ASSET_HAS_FINDING_RELATIONSHIPS]: {
      disabled: !enableAssetIngestion,
    },
    [Steps.FINDINGS]: { disabled: false },
    [Steps.ALERTS]: { disabled: false },
    [Steps.GROUP_USER_RELATIONSHIPS]: { disabled: false },
    [Steps.USER_ROLE_RELATIONSHIPS]: { disabled: false },
  };
}
