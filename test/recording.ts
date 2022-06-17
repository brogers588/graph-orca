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
  if (Array.isArray(parsedResponseText.data)) {
    if (entry.request.url.includes('/query/assets')) {
      parsedResponseText.total_items = 125;
      for (let i = 0; i < parsedResponseText.data.length; i++) {
        parsedResponseText.data[i] = {
          asset_unique_id: parsedResponseText.data[i].asset_unique_id,
          asset_name: parsedResponseText.data[i].asset_name,
        };
      }
    } else if (entry.request.url.includes('/query/cves')) {
      parsedResponseText.total_items = 125;
      for (let i = 0; i < parsedResponseText.data.length; i++) {
        const cveResponse = parsedResponseText.data[i];
        parsedResponseText.data[i] = {
          cve_id: cveResponse.cve_id,
          asset_unique_id: cveResponse.asset_unique_id,
          type: cveResponse.type,
          score: cveResponse.score,
          context: cveResponse.context,
          labels: cveResponse.labels,
          severity: cveResponse.severity,
          vendor_source_link: cveResponse.vendor_source_link,
          fix_available_state: cveResponse.fix_available_state,
          nvd: cveResponse.nvd,
          level: cveResponse.level,
          published: cveResponse.published,
          asset_type: cveResponse.asset_type,
          summary: cveResponse.summary,
        };
      }
    }
  }

  entry.response.content.text = JSON.stringify(parsedResponseText);
}
