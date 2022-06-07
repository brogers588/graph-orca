import fetch, { Response } from 'node-fetch';

import { IntegrationProviderAuthenticationError } from '@jupiterone/integration-sdk-core';

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
  OrcaAssetsResponse,
  OrcaCVE,
  OrcaCVEsResponse,
} from './types';

export type ResourceIteratee<T> = (each: T) => Promise<void> | void;

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

  constructor(readonly config: IntegrationConfig) {}

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
   * @returns
   */
  private async authenticateAndFetch(
    url: string,
    retries = 0,
    maxRetries = 1,
  ): Promise<Response> {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${APIClient.accessToken}`,
      },
    });

    if (response.ok) {
      return response;
    } else if (response.status === 401 && retries < maxRetries) {
      await this.authenticate();

      return this.authenticateAndFetch(url, retries++, maxRetries);
    } else {
      throw new Error(
        `GET request failed: url=${url}, status=${response.status}, statusText=${response.statusText}`,
      );
    }
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
   * @returns the body of the request using the provided generic type
   */
  private async getRequest<T>(endpoint: string): Promise<T> {
    const url = `${this.config.clientBaseUrl}/api${endpoint}`;

    if (!APIClient.accessToken) {
      await this.authenticate();
    }

    const response = await this.authenticateAndFetch(url, 0, 1);

    if (response.ok) {
      return response.json();
    } else {
      throw new Error(
        `GET request failed: url=${url}, status=${response.status}, statusText=${response.statusText}`,
      );
    }
  }

  /**
   * Iterates each user resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateUsers(
    iteratee: ResourceIteratee<OrcaUser>,
  ): Promise<void> {
    const response: OrcaOrganizationUsersResponse = await this.getRequest(
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
    const response: OrcaAccessUsersResponse = await this.getRequest(
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
    const groupsResponse: OrcaGroupsResponse = await this.getRequest(
      '/rbac/group',
    );

    for (const group of groupsResponse.data.groups) {
      const groupResponse: OrcaGroupResponse = await this.getRequest(
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
    const response: OrcaRolesResponse = await this.getRequest('/rbac/role');

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
    const response: OrcaAssetsResponse = await this.getRequest('/assets');

    for (const asset of response.data) {
      await iteratee(asset);
    }
  }

  /**
   * Iterates each cve resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateCVEs(iteratee: ResourceIteratee<OrcaCVE>): Promise<void> {
    const response: OrcaCVEsResponse = await this.getRequest('/cves');

    for (const cve of response.data) {
      await iteratee(cve);
    }
  }
}

export function createAPIClient(config: IntegrationConfig): APIClient {
  return new APIClient(config);
}
