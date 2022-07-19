import { executeStepWithDependencies } from '@jupiterone/integration-sdk-testing';
import { buildStepTestConfigForStep } from '../../../test/config';
import { Recording, setupProjectRecording } from '../../../test/recording';
import { Steps } from '../constants';

// See test/README.md for details
let recording: Recording;
afterEach(async () => {
  await recording.stop();
});

test.skip('fetch-assets', async () => {
  /**
   * Note: if attempting to re-record, the data set is very large.
   * Modify the pagination function in the client to set
   *       response.total_items = 125;
   */
  recording = setupProjectRecording({
    directory: __dirname,
    name: 'fetch-assets',
  });

  const stepConfig = buildStepTestConfigForStep(Steps.ASSETS);
  const stepResult = await executeStepWithDependencies(stepConfig);
  expect(stepResult).toMatchStepMetadata(stepConfig);
});
