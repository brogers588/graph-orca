import {
  RelationshipClass,
  RelationshipDirection,
  StepEntityMetadata,
  StepMappedRelationshipMetadata,
  StepRelationshipMetadata,
} from '@jupiterone/integration-sdk-core';

export const Steps = {
  ACCOUNT: 'fetch-account',
  USERS: 'fetch-users',
  GROUPS: 'fetch-groups',
  ROLES: 'fetch-roles',
  ASSETS: 'fetch-assets',
  FINDINGS: 'fetch-findings',
  ALERTS: 'fetch-alerts',
  GROUP_USER_RELATIONSHIPS: 'build-user-group-relationships',
  USER_ROLE_RELATIONSHIPS: 'build-user-role-relationships',
};

export const Entities: Record<
  'ACCOUNT' | 'GROUP' | 'USER' | 'ROLE' | 'ASSET' | 'FINDING' | 'CVE' | 'ALERT',
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
  ASSET: {
    resourceName: 'Asset',
    _type: 'orca_asset',
    _class: ['Resource'],
    schema: {
      properties: {
        name: { type: 'string' },
      },
      required: ['name'],
    },
  },
  FINDING: {
    resourceName: 'Finding',
    _type: 'orca_finding',
    _class: ['Finding'],
    schema: {
      properties: {
        name: { type: 'string' },
      },
      required: ['name'],
    },
  },
  CVE: {
    resourceName: 'CVE',
    _type: 'cve',
    _class: ['Vulnerability'],
    schema: {
      properties: {
        name: { type: 'string' },
        displayName: { type: 'string' },
        cvssScore: { type: 'string' },
        references: { type: 'array', items: { type: 'string' } },
        webLink: { type: 'string' },
      },
      required: ['name', 'displayName', 'cvssScore', 'references', 'weblink'],
    },
  },
  ALERT: {
    resourceName: 'Alert',
    _type: 'orca_finding_alert',
    _class: ['Finding'],
    indexMetadata: {
      enabled: false,
    },
    schema: {
      properties: {
        name: { type: 'string' },
      },
      required: ['name', 'category'],
    },
  },
};

export const MappedRelationships: Record<
  'FINDING_IS_CVE',
  StepMappedRelationshipMetadata
> = {
  FINDING_IS_CVE: {
    _type: 'orca_finding_is_cve',
    sourceType: Entities.FINDING._type,
    _class: RelationshipClass.IS,
    targetType: Entities.CVE._type,
    direction: RelationshipDirection.FORWARD,
  },
};

export const Relationships: Record<
  | 'ACCOUNT_HAS_USER'
  | 'ACCOUNT_HAS_GROUP'
  | 'ACCOUNT_HAS_ASSET'
  | 'GROUP_HAS_USER'
  | 'USER_ASSIGNED_ROLE'
  | 'ACCOUNT_HAS_FINDING'
  | 'ACCOUNT_HAS_FINDING_ALERT'
  | 'ASSET_HAS_FINDING',
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
  ACCOUNT_HAS_ASSET: {
    _type: 'orca_account_has_asset',
    sourceType: Entities.ACCOUNT._type,
    _class: RelationshipClass.HAS,
    targetType: Entities.ASSET._type,
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
  ACCOUNT_HAS_FINDING: {
    _type: 'orca_account_has_finding',
    sourceType: Entities.ACCOUNT._type,
    _class: RelationshipClass.HAS,
    targetType: Entities.FINDING._type,
  },
  ASSET_HAS_FINDING: {
    _type: 'orca_asset_has_finding',
    sourceType: Entities.ASSET._type,
    _class: RelationshipClass.HAS,
    targetType: Entities.FINDING._type,
  },
  ACCOUNT_HAS_FINDING_ALERT: {
    _type: 'orca_account_has_finding_alert',
    sourceType: Entities.ACCOUNT._type,
    _class: RelationshipClass.HAS,
    targetType: Entities.ALERT._type,
  },
};
