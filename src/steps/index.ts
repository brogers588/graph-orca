import { accountSteps } from './account';
import { accessSteps } from './access';
import { assetSteps } from './asset';
import { findingSteps } from './findings';
import { alertSteps } from './alerts';

const integrationSteps = [
  ...accountSteps,
  ...accessSteps,
  ...assetSteps,
  ...findingSteps,
  ...alertSteps,
];

export { integrationSteps };
