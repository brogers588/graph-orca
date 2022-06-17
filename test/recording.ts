import {
  setupRecording,
  Recording,
  SetupRecordingInput,
  mutations,
} from '@jupiterone/integration-sdk-testing';

export { Recording };

function isRecordingEnabled(): boolean {
  return Boolean(process.env.LOAD_ENV);
}

export function setupProjectRecording(
  input: Omit<SetupRecordingInput, 'mutateEntry'>,
): Recording {
  const recordingEnabled = isRecordingEnabled();

  return setupRecording({
    ...input,
    redactedRequestHeaders: ['Authorization'],
    redactedResponseHeaders: ['set-cookie'],
    mutateEntry: (entry) => redact(entry),
    options: {
      mode: recordingEnabled ? 'record' : 'replay',
      ...input.options,
    },
  });
}

function redact(entry): void {
  if (entry.request.postData) {
    entry.request.postData.text = '[REDACTED]';
  }

  if (!entry.response.content.text) {
    return;
  }

  //let's unzip the entry so we can modify it
  mutations.unzipGzippedRecordingEntry(entry);

  const responseText = entry.response.content.text;
  const parsedResponseText = JSON.parse(responseText.replace(/\r?\n|\r/g, ''));

  if (parsedResponseText.jwt) {
    if (parsedResponseText.jwt.refresh) {
      parsedResponseText.jwt.refresh = '[REDACTED]';
    }

    if (parsedResponseText.jwt.access) {
      parsedResponseText.jwt.access = '[REDACTED]';
    }
  }

  if (parsedResponseText.next_page_token) {
    parsedResponseText.next_page_token = ['REDACTED'];
  }

  // To prevent an excess of data (with possible gitleak errors),
  // trim down to only the data currently used.
  if (
    Array.isArray(parsedResponseText.data) &&
    entry.request.url.includes('/query/assets')
  ) {
    for (let i = 0; i < parsedResponseText.data.length; i++) {
      parsedResponseText.data[i] = {
        asset_unique_id: parsedResponseText.data[i].asset_unique_id,
        asset_name: parsedResponseText.data[i].asset_name,
      };
    }
  }

  entry.response.content.text = JSON.stringify(parsedResponseText);
}
