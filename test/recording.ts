import {
  setupRecording,
  Recording,
  SetupRecordingInput,
  mutations,
} from '@jupiterone/integration-sdk-testing';

export { Recording };

export function setupProjectRecording(
  input: Omit<SetupRecordingInput, 'mutateEntry'>,
): Recording {
  return setupRecording({
    ...input,
    redactedRequestHeaders: ['Authorization'],
    redactedResponseHeaders: ['set-cookie'],
    mutateEntry: (entry) => redact(entry),
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

  entry.response.content.text = JSON.stringify(parsedResponseText);
}
