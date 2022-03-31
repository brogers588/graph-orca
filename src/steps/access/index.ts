import {
  Entity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  IntegrationMissingKeyError,
  getRawData,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../../client';
import { IntegrationConfig } from '../../config';
import { OrcaGroup } from '../../types';
import { ACCOUNT_ENTITY_KEY } from '../account';
import { Entities, Steps, Relationships } from '../constants';
import {
  createAccountGroupRelationship,
  createAccountUserRelationship,
  createGroupEntity,
  createGroupUserRelationship,
  createRoleEntity,
  createUserEntity,
  createUserRoleRelationship,
} from './converter';

export async function fetchUsers({
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  const accountEntity = (await jobState.getData(ACCOUNT_ENTITY_KEY)) as Entity;

  await apiClient.iterateUsers(async (user) => {
    const userEntity = await jobState.addEntity(createUserEntity(user));

    await jobState.addRelationship(
      createAccountUserRelationship(accountEntity, userEntity),
    );
  });
}

export async function fetchGroups({
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  const accountEntity = (await jobState.getData(ACCOUNT_ENTITY_KEY)) as Entity;

  await apiClient.iterateGroups(async (group) => {
    const groupEntity = await jobState.addEntity(createGroupEntity(group));

    await jobState.addRelationship(
      createAccountGroupRelationship(accountEntity, groupEntity),
    );
  });
}

export async function fetchRoles({
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  await apiClient.iterateRoles(async (role) => {
    await jobState.addEntity(createRoleEntity(role));
  });
}

export async function buildGroupUserRelationships({
  jobState,
  logger,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  await jobState.iterateEntities(
    { _type: Entities.GROUP._type },
    async (groupEntity) => {
      const group = getRawData<OrcaGroup>(groupEntity);

      if (!group) {
        logger.warn(
          { _key: groupEntity._key },
          'Could not get raw data for group entity',
        );
        return;
      }

      for (const user of group.users || []) {
        const userEntity = await jobState.findEntity(user.id);

        if (!userEntity) {
          throw new IntegrationMissingKeyError(
            `Expected user with key to exist (key=${user.id})`,
          );
        }

        await jobState.addRelationship(
          createGroupUserRelationship(groupEntity, userEntity),
        );
      }
    },
  );
}

export async function buildUserRoleRelationships({
  jobState,
  instance,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  await apiClient.iterateAccessUsers(async (userWithRole) => {
    const { user, role } = userWithRole;

    const userEntity = await jobState.findEntity(user.id);

    if (!userEntity) {
      return;
    }

    const roleEntity = await jobState.findEntity(role.id);

    if (!roleEntity) {
      return;
    }

    await jobState.addRelationship(
      createUserRoleRelationship(userEntity, roleEntity),
    );
  });
}

export const accessSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: Steps.USERS,
    name: 'Fetch Users',
    entities: [Entities.USER],
    relationships: [Relationships.ACCOUNT_HAS_USER],
    dependsOn: [Steps.ACCOUNT],
    executionHandler: fetchUsers,
  },
  {
    id: Steps.GROUPS,
    name: 'Fetch Groups',
    entities: [Entities.GROUP],
    relationships: [Relationships.ACCOUNT_HAS_GROUP],
    dependsOn: [Steps.ACCOUNT],
    executionHandler: fetchGroups,
  },
  {
    id: Steps.ROLES,
    name: 'Fetch Roles',
    entities: [Entities.ROLE],
    relationships: [Relationships.USER_ASSIGNED_ROLE],
    dependsOn: [Steps.ACCOUNT],
    executionHandler: fetchRoles,
  },
  {
    id: Steps.GROUP_USER_RELATIONSHIPS,
    name: 'Build Group -> User Relationships',
    entities: [],
    relationships: [Relationships.GROUP_HAS_USER],
    dependsOn: [Steps.GROUPS, Steps.USERS],
    executionHandler: buildGroupUserRelationships,
  },
  {
    id: Steps.USER_ROLE_RELATIONSHIPS,
    name: 'Build User -> Role Relationships',
    entities: [],
    relationships: [Relationships.USER_ASSIGNED_ROLE],
    dependsOn: [Steps.USERS, Steps.ROLES],
    executionHandler: buildUserRoleRelationships,
  },
];
