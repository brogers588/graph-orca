import { executeStepWithDependencies } from '@jupiterone/integration-sdk-testing';
import { buildStepTestConfigForStep } from '../../../test/config';
import { Recording, setupProjectRecording } from '../../../test/recording';
import { Steps } from '../constants';

// See test/README.md for details
let recording: Recording;
afterEach(async () => {
  await recording.stop();
});

test('fetch-assets', async () => {
  /**
   * Note: if attempting to re-record, the data set is very large.
   * Consider modifying the client to limit pagination and
   * update the response `total_items` value in recording.har to
   * a smaller value e.g. 200.
   */
  recording = setupProjectRecording({
    directory: __dirname,
    name: 'fetch-assets',
  });

  const stepConfig = buildStepTestConfigForStep(Steps.ASSETS);
  const stepResult = await executeStepWithDependencies(stepConfig);
  expect(stepResult).toMatchStepMetadata(stepConfig);
});
