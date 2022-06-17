import { executeStepWithDependencies } from '@jupiterone/integration-sdk-testing';
import { buildStepTestConfigForStep } from '../../../test/config';
import { Recording, setupProjectRecording } from '../../../test/recording';
import {
  Entities,
  MappedRelationships,
  Relationships,
  Steps,
} from '../constants';

// See test/README.md for details
let recording: Recording;
afterEach(async () => {
  await recording.stop();
});

jest.setTimeout(300000);

test('fetch-findings', async () => {
  recording = setupProjectRecording({
    directory: __dirname,
    name: 'fetch-findings',
  });

  const stepConfig = buildStepTestConfigForStep(Steps.FINDINGS);
  const { collectedEntities, collectedRelationships, encounteredTypes } =
    await executeStepWithDependencies(stepConfig);

  expect(encounteredTypes).toMatchSnapshot();
  expect(
    collectedEntities.some((e) => e._type === Entities.FINDING._type),
  ).toBeTruthy();
  expect(
    collectedRelationships.some(
      (e) => e._type === Relationships.ACCOUNT_HAS_FINDING._type,
    ),
  ).toBeTruthy();
  expect(
    collectedRelationships.some(
      (e) => e._type === Relationships.ASSET_HAS_FINDING._type,
    ),
  ).toBeTruthy();
  expect(
    collectedRelationships.some(
      (e) => e._type === MappedRelationships.FINDING_IS_CVE._type,
    ),
  ).toBeTruthy();
});
