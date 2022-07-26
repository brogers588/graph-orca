import fetch, { Response } from 'node-fetch';

import {
  IntegrationError,
  IntegrationLogger,
  IntegrationProviderAPIError,
  IntegrationProviderAuthenticationError,
} from '@jupiterone/integration-sdk-core';

import { IntegrationConfig } from './config';
import {
  OrcaOrganizationUsersResponse,
  OrcaGroupsResponse,
  OrcaGroup,
  OrcaGroupResponse,
  OrcaRolesResponse,
  OrcaRole,
  OrcaUserWithRole,
  OrcaUserSessionResponse,
  OrcaAccessUsersResponse,
  OrcaUser,
  OrcaAsset,
  OrcaCVE,
  OrcaResponse,
  OrcaAsyncDownloadResponse,
  OrcaAsyncDownloadStatusResponse,
  OrcaAlert,
} from './types';
import StreamArray from 'stream-json/streamers/StreamArray';
import { pipeline } from 'stream';
import { promisify } from 'util';

const streamPipelineAsync = promisify(pipeline);

export type ResourceIteratee<T> = (each: T) => Promise<void>;

async function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

async function streamArray<T>(
  body: NodeJS.ReadableStream,
  onElement: (item: T) => Promise<void>,
): Promise<any> {
  await streamPipelineAsync(
    body,
    StreamArray.withParser(),
    async (iterateable) => {
      for await (const el of iterateable) {
        await onElement(el.value);
      }
    },
  );
}

/**
 * An APIClient maintains authentication state and provides an interface to
 * third party data APIs.
 *
 * It is recommended that integrations wrap provider data APIs to provide a
 * place to handle error responses and implement common patterns for iterating
 * resources.
 */
export class APIClient {
  private static accessToken?: string;

  constructor(
    readonly config: IntegrationConfig,
    readonly logger: IntegrationLogger,
  ) {}

  /**
   * Authenticates with Orca Security API and stores access & refresh tokens.
   */
  private async authenticate(): Promise<void> {
    const response = await fetch(
      `${this.config.clientBaseUrl}/api/user/session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          security_token: this.config.clientSecret,
        }),
      },
    );

    if (!response.ok) {
      throw new IntegrationProviderAuthenticationError({
        cause: new Error('Provider authentication failed'),
        endpoint: `${this.config.clientBaseUrl}/api/user/session`,
        status: response.status,
        statusText: response.statusText,
      });
    }

    const body: OrcaUserSessionResponse = await response.json();

    APIClient.accessToken = body.jwt.access;
  }

  /**
   * Attempts to fetch the provided url. Automatically authenticates if 401 is received, and retries immediately after.
   *
   * @param url the endpoint to query
   * @param retries the current retry count
   * @param maxRetries the max retries
   * @param method the method of the query
   * @param body the body of the query
   * @returns
   */
  private async authenticateAndFetch(
    url: string,
    retries = 0,
    maxRetries = 1,
    method: 'GET' | 'POST' = 'GET',
    body?: any,
  ): Promise<Response> {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${APIClient.accessToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401 && retries < maxRetries) {
      await this.authenticate();

      return this.authenticateAndFetch(url, retries++, maxRetries);
    }

    return response;
  }

  /**
   * Verifies authentication by making lightweight HEAD request to https://api.orcasecurity.io/api/auth/tokens.
   */
  public async verifyAuthentication(): Promise<void> {
    if (!APIClient.accessToken) {
      await this.authenticate();
    }

    const response = await fetch(
      `${this.config.clientBaseUrl}/api/auth/tokens`,
      {
        method: 'HEAD',
        headers: {
          Authorization: `Bearer ${APIClient.accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new IntegrationProviderAuthenticationError({
        cause: new Error('Provider authentication failed'),
        endpoint: `${this.config.clientBaseUrl}/api/auth/tokens`,
        status: response.status,
        statusText: response.statusText,
      });
    }
  }

  /**
   * Makes a GET request to the provided relative endpoint at https://api.orcasecurity.io/api.
   *
   * @param endpoint the endpoint to query
   * @param method the method of the query
   * @param body the body of the query
   * @returns the body of the request using the provided generic type
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any,
  ): Promise<T> {
    const url = `${this.config.clientBaseUrl}/api${endpoint}`;

    if (!APIClient.accessToken) {
      await this.authenticate();
    }

    const makeAuthenticatedRequest = async (authRetryCount: number) => {
      if (authRetryCount > 0) {
        this.logger.info(
          {
            authRetryCount,
            endpoint,
            method,
          },
          'Making authenticated request',
        );
      }

      const response = await this.authenticateAndFetch(url, 0, 1, method, body);

      if (response.ok) {
        return response.json();
      } else {
        let errorResultBody;

        try {
          // Orca includes additional information upon request failures.
          // Example:
          //
          // { status: 'failure', error: 'invalid limit 1000000' }
          errorResultBody = await response.json();
        } catch (err) {
          // Unable to parse the error result body, but still should log
          // additional info below.
        }

        this.logger.warn(
          {
            result: errorResultBody,
            endpoint: url,
            status: response.status,
            statusText: response.statusText,
            authRetryCount,
          },
          'Error making request',
        );

        if (
          authRetryCount < 4 &&
          response.status === 403 &&
          errorResultBody?.status === 'failure'
        ) {
          // This probably means that our token expired and we need to refresh
          // Example from Orca API:
          //
          // result.message: 'Given token not valid for any token type'
          // result.status: 'failure'
          // status: 403
          // statusText: 'Forbidden'
          await this.authenticate();
          return makeAuthenticatedRequest(++authRetryCount);
        }

        throw new IntegrationProviderAPIError({
          endpoint: url,
          status: response.status,
          statusText: response.statusText,
        });
      }
    };

    return makeAuthenticatedRequest(0);
  }

  /**
   * Makes a paginated request to the provided relative endpoint.
   *
   * @param uri the endpoint to query
   * @param iteratee receives each resource to produce entities/relationships
   */
  private async paginatedQuery<T>(
    uri: string,
    iteratee: ResourceIteratee<T>,
  ): Promise<void> {
    const LIMIT = 100;
    let page = 0;
    let proceed = true;

    do {
      const response = await this.request<OrcaResponse<T[]>>(uri, 'POST', {
        grouping: true,
        start_at_index: page * LIMIT,
        limit: LIMIT,
      });

      for (const item of response.data) {
        await iteratee(item);
      }

      page++;
      proceed = response.total_items > page * LIMIT;
    } while (proceed);
  }

  /**
   * Iterates each user resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateUsers(
    iteratee: ResourceIteratee<OrcaUser>,
  ): Promise<void> {
    const response: OrcaOrganizationUsersResponse = await this.request(
      '/organization/users',
    );

    for (const user of response.data.users) {
      await iteratee({
        id: user.user_id,
        email: user.email,
        first_name: user.first,
        last_name: user.last,
      });
    }
  }

  /**
   * Iterates each rbac access user in the provider.
   *
   * @param iteratee receives each resource to produce relationships
   */
  async iterateAccessUsers(
    iteratee: ResourceIteratee<OrcaUserWithRole>,
  ): Promise<void> {
    const response: OrcaAccessUsersResponse = await this.request(
      '/rbac/access/user',
    );

    for (const rbacUser of response.data) {
      await iteratee({
        user: rbacUser.user,
        role: rbacUser.role,
      });
    }
  }

  /**
   * Iterates each group resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateGroups(
    iteratee: ResourceIteratee<OrcaGroup>,
  ): Promise<void> {
    const groupsResponse: OrcaGroupsResponse = await this.request(
      '/rbac/group',
    );

    for (const group of groupsResponse.data.groups) {
      const groupResponse: OrcaGroupResponse = await this.request(
        `/rbac/group/${group.id}`,
      );

      await iteratee({
        id: group.id,
        name: group.name,
        sso_group: group.sso_group,
        description: group.description,
        users: groupResponse.data.users,
      });
    }
  }

  /**
   * Iterates each role resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateRoles(
    iteratee: ResourceIteratee<OrcaRole>,
  ): Promise<void> {
    const response: OrcaRolesResponse = await this.request('/rbac/role');

    for (const role of response.data) {
      await iteratee(role);
    }
  }

  /**
   * Iterates each asset resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateAssets(
    iteratee: ResourceIteratee<OrcaAsset>,
  ): Promise<void> {
    await this.iterateViaBulkDownload<OrcaAsset>(iteratee, '/query/assets');
  }

  /**
   * Iterates each cve resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateCVEs(iteratee: ResourceIteratee<OrcaCVE>): Promise<void> {
    await this.paginatedQuery('/query/cves', iteratee);
  }

  public async iterateAlerts(
    iteratee: ResourceIteratee<OrcaAlert>,
  ): Promise<void> {
    await this.iterateViaBulkDownload<OrcaAlert>(iteratee, '/query/alerts');
  }

  /**
   * Uses the bulk JSON download endpoints to fetch data.
   * @param endpoint
   * @param iteratee
   * @param body
   * @private
   */
  private async iterateViaBulkDownload<T>(
    iteratee: ResourceIteratee<T>,
    endpoint: string,
    body?: object,
  ): Promise<void> {
    const response = await this.request<OrcaAsyncDownloadResponse>(
      endpoint,
      'POST',
      {
        download_async: true,
        get_download_link: true,
        // ...body,
      },
    );

    const downloadUrl = await this.waitForResourceDownloadUrl(
      response.request_token,
    );

    const exportResourceDownloadResponse = await fetch(downloadUrl);

    if (!exportResourceDownloadResponse.ok) {
      let exportedResourceTextLen: number | undefined;

      try {
        const exportedResourceText =
          await exportResourceDownloadResponse.text();
        exportedResourceTextLen = exportedResourceText.length;
      } catch (err) {
        // Ignore if this fails. We are just gathering more info.
      }

      this.logger.warn(
        {
          endpoint,
          exportedResourceTextLen,
          status: exportResourceDownloadResponse.status,
          statusText: exportResourceDownloadResponse.statusText,
        },
        'Failed to download exported resource file',
      );

      throw new IntegrationError({
        code: 'RESOURCE_DOWNLOAD_ERROR',
        message: 'Failed to download exported resource file',
        fatal: false,
      });
    }

    try {
      await streamArray<T>(exportResourceDownloadResponse.body, iteratee);
    } catch (err) {
      this.logger.warn({ err }, 'Failed to parse exported resources');

      throw new IntegrationError({
        code: 'RESOURCE_EXPORT_PARSE_ERROR',
        message: 'Failed to parse exported resources',
        fatal: false,
      });
    }
  }

  async waitForResourceDownloadUrl(requestToken: string): Promise<string> {
    let resourceUrl: string | undefined;
    let totalSleepTimeMs = 0;

    let totalIterations = 0;
    const sleepTimeMs = 5000; // 5 seconds
    const maxSleepTimeMs = 900000; // 15mins

    do {
      await sleep(sleepTimeMs);
      totalSleepTimeMs += sleepTimeMs;

      const statusResponse =
        await this.request<OrcaAsyncDownloadStatusResponse>(
          `/query/status/?request_token=${requestToken}`,
          'GET',
        );

      totalIterations++;

      if (totalIterations % 10 === 0) {
        this.logger.info(
          {
            totalIterations,
            totalSleepTimeMs,
          },
          'Total query status checks',
        );
      }

      if (statusResponse.status !== 'success') {
        this.logger.warn(
          {
            statusResponse: {
              ...statusResponse,
              file_location: !!statusResponse.file_location,
            },
          },
          'Failed to fetch resource query status',
        );

        throw new IntegrationProviderAPIError({
          endpoint: '/query/status',
          status: 200,
          statusText: 'Failed to fetch resource query status',
          message: 'Failed to fetch resource query status',
        });
      }

      if (totalSleepTimeMs >= maxSleepTimeMs) {
        throw new IntegrationError({
          code: 'RESOURCE_DOWNLOAD_TIMEOUT',
          message: `Maximum time reached when attempting to export Orca resource (timeElapsed=${maxSleepTimeMs}ms)`,
          fatal: false,
        });
      }

      if (statusResponse.file_location) {
        resourceUrl = statusResponse.file_location;
      }
    } while (!resourceUrl);

    return resourceUrl;
  }
}

export function createAPIClient(
  config: IntegrationConfig,
  logger: IntegrationLogger,
): APIClient {
  return new APIClient(config, logger);
}
