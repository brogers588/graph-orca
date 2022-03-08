import {
  RelationshipClass,
  StepEntityMetadata,
  StepRelationshipMetadata,
} from '@jupiterone/integration-sdk-core';

export const Steps = {
  ACCOUNT: 'fetch-account',
  USERS: 'fetch-users',
  GROUPS: 'fetch-groups',
  ROLES: 'fetch-roles',
  GROUP_USER_RELATIONSHIPS: 'build-user-group-relationships',
  USER_ROLE_RELATIONSHIPS: 'build-user-role-relationships',
};

export const Entities: Record<
  'ACCOUNT' | 'GROUP' | 'USER' | 'ROLE',
  StepEntityMetadata
> = {
  ACCOUNT: {
    resourceName: 'Account',
    _type: 'orca_account',
    _class: ['Account'],
    schema: {
      properties: {
        mfaEnabled: { type: 'boolean' },
      },
      required: ['mfaEnabled'],
    },
  },
  GROUP: {
    resourceName: 'UserGroup',
    _type: 'orca_group',
    _class: ['UserGroup'],
    schema: {
      properties: {
        name: { type: 'string' },
      },
      required: ['name'],
    },
  },
  USER: {
    resourceName: 'User',
    _type: 'orca_user',
    _class: ['User'],
    schema: {
      properties: {
        username: { type: 'string' },
        email: { type: 'string' },
        active: { type: 'boolean' },
        firstName: { type: 'string' },
      },
      required: ['username', 'email', 'active', 'firstName'],
    },
  },
  ROLE: {
    resourceName: 'Role',
    _type: 'orca_role',
    _class: ['AccessRole'],
    schema: {
      properties: {
        name: { type: 'string' },
      },
      required: ['name'],
    },
  },
};

export const Relationships: Record<
  | 'ACCOUNT_HAS_USER'
  | 'ACCOUNT_HAS_GROUP'
  | 'GROUP_HAS_USER'
  | 'USER_ASSIGNED_ROLE',
  StepRelationshipMetadata
> = {
  ACCOUNT_HAS_USER: {
    _type: 'orca_account_has_user',
    sourceType: Entities.ACCOUNT._type,
    _class: RelationshipClass.HAS,
    targetType: Entities.USER._type,
  },
  ACCOUNT_HAS_GROUP: {
    _type: 'orca_account_has_group',
    sourceType: Entities.ACCOUNT._type,
    _class: RelationshipClass.HAS,
    targetType: Entities.GROUP._type,
  },
  GROUP_HAS_USER: {
    _type: 'orca_group_has_user',
    sourceType: Entities.GROUP._type,
    _class: RelationshipClass.HAS,
    targetType: Entities.USER._type,
  },
  USER_ASSIGNED_ROLE: {
    _type: 'orca_user_assigned_role',
    sourceType: Entities.USER._type,
    _class: RelationshipClass.ASSIGNED,
    targetType: Entities.ROLE._type,
  },
};
