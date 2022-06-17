import { IntegrationConfig } from './config';
import { IntegrationExecutionContext } from '@jupiterone/integration-sdk-core';
import { Steps } from './steps/constants';

export default function getStepStartStates(
  context: IntegrationExecutionContext<IntegrationConfig>,
) {
  const { config } = context.instance;

  const enableAssetAndFindingIngestion =
    config.enableAssetAndFindingIngestion ||
    process.env.ENABLE_ASSET_AND_FINDING_INGESTION;

  return {
    [Steps.ACCOUNT]: { disabled: false },
    [Steps.USERS]: { disabled: false },
    [Steps.GROUPS]: { disabled: false },
    [Steps.ROLES]: { disabled: false },
    [Steps.ASSETS]: { disabled: !enableAssetAndFindingIngestion },
    [Steps.FINDINGS]: { disabled: !enableAssetAndFindingIngestion },
    [Steps.GROUP_USER_RELATIONSHIPS]: { disabled: false },
    [Steps.USER_ROLE_RELATIONSHIPS]: { disabled: false },
  };
}
