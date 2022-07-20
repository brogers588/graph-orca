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
} from './types';

export type ResourceIteratee<T> = (each: T) => Promise<void> | void;

async function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
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

    const response = await this.authenticateAndFetch(url, 0, 1, method, body);

    if (response.ok) {
      return response.json();
    } else {
      try {
        // Orca includes additional information upon request failures.
        // Example:
        //
        // { status: 'failure', error: 'invalid limit 1000000' }
        this.logger.warn(
          {
            result: await response.json(),
            endpoint: url,
            status: response.status,
            statusText: response.statusText,
          },
          'Error making request',
        );
      } catch (err) {
        // Could not parse the JSON body. Skip.
      }

      throw new IntegrationProviderAPIError({
        endpoint: url,
        status: response.status,
        statusText: response.statusText,
      });
    }
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

  async waitForAssetDownloadUrl(requestToken: string): Promise<string> {
    let assetUrl: string | undefined;
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
          'Failed to fetch asset query status',
        );

        throw new IntegrationProviderAPIError({
          endpoint: '/query/status',
          status: 200,
          statusText: 'Failed to fetch asset query status',
          message: 'Failed to fetch asset query status',
        });
      }

      if (totalSleepTimeMs >= maxSleepTimeMs) {
        throw new IntegrationError({
          code: 'ASSET_DOWNLOAD_TIMEOUT',
          message: `Maximum time reached when attempting to export Orca assets (timeElapsed=${maxSleepTimeMs}ms)`,
          fatal: false,
        });
      }

      if (statusResponse.file_location) {
        assetUrl = statusResponse.file_location;
      }
    } while (!assetUrl);

    return assetUrl;
  }

  /**
   * Iterates each asset resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateAssets(
    iteratee: ResourceIteratee<OrcaAsset>,
  ): Promise<void> {
    const response = await this.request<OrcaAsyncDownloadResponse>(
      '/query/assets',
      'POST',
      {
        download_async: true,
        get_download_link: true,
      },
    );

    const downloadUrl = await this.waitForAssetDownloadUrl(
      response.request_token,
    );

    const exportAssetDownloadResponse = await fetch(downloadUrl);

    if (!exportAssetDownloadResponse.ok) {
      let exportedAssetTextLen: number | undefined;

      try {
        const exportedAssetText = await exportAssetDownloadResponse.text();
        exportedAssetTextLen = exportedAssetText.length;
      } catch (err) {
        // Ignore if this fails. We are just gathering more info.
      }

      this.logger.warn(
        {
          exportedAssetTextLen,
          status: exportAssetDownloadResponse.status,
          statusText: exportAssetDownloadResponse.statusText,
        },
        'Failed to download exported assets file',
      );

      throw new IntegrationError({
        code: 'ASSET_DOWNLOAD_ERROR',
        message: 'Failed to download exported assets file',
        fatal: false,
      });
    }

    let exportedAssets: OrcaAsset[] | undefined;

    try {
      // NOTE: First pull the response body so we can verify that it has
      // content. Then we will parse later.
      const exportedAssetText = await exportAssetDownloadResponse.text();

      this.logger.info(
        {
          exportedAssetTextLen: exportedAssetText.length,
        },
        'Export asset body downloaded',
      );

      exportedAssets = JSON.parse(exportedAssetText) as OrcaAsset[];
    } catch (err) {
      throw new IntegrationError({
        code: 'ASSET_EXPORT_PARSE_ERROR',
        message: 'Failed to parse exported assets',
        fatal: false,
      });
    }

    this.logger.info(
      {
        exportedAssets: exportedAssets.length,
      },
      'Succesfully exported assets',
    );

    for (const asset of exportedAssets) {
      await iteratee(asset);
    }
  }

  /**
   * Iterates each cve resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateCVEs(iteratee: ResourceIteratee<OrcaCVE>): Promise<void> {
    await this.paginatedQuery('/query/cves', iteratee);
  }
}

export function createAPIClient(
  config: IntegrationConfig,
  logger: IntegrationLogger,
): APIClient {
  return new APIClient(config, logger);
}
