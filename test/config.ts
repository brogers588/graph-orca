import { IntegrationInvocationConfig } from '@jupiterone/integration-sdk-core';
import { StepTestConfig } from '@jupiterone/integration-sdk-testing';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { invocationConfig } from '../src';
import { IntegrationConfig } from '../src/config';

if (process.env.LOAD_ENV) {
  dotenv.config({
    path: path.join(__dirname, '../.env'),
  });
}
const DEFAULT_CLIENT_EMAIL = 'dummy-orca-client-email';
const DEFAULT_CLIENT_SECRET = 'dummy-orca-client-secret';
const DEFAULT_CLIENT_URL = 'https://app.eu.orcasecurity.io';

export const integrationConfig: IntegrationConfig = {
  clientEmail: process.env.CLIENT_EMAIL || DEFAULT_CLIENT_EMAIL,
  clientSecret: process.env.CLIENT_SECRET || DEFAULT_CLIENT_SECRET,
  clientBaseUrl: process.env.CLIENT_BASE_URL || DEFAULT_CLIENT_URL,
};

export function buildStepTestConfigForStep(stepId: string): StepTestConfig {
  return {
    stepId,
    instanceConfig: integrationConfig,
    invocationConfig: invocationConfig as IntegrationInvocationConfig,
  };
}
