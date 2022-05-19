import { accountSteps } from './account';
import { accessSteps } from './access';
import { assetSteps } from './assets';
import { findingSteps } from './findings';

const integrationSteps = [
  ...accountSteps,
  ...accessSteps,
  ...assetSteps,
  ...findingSteps,
];

export { integrationSteps };
