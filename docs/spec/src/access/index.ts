import { RelationshipClass, StepSpec } from '@jupiterone/integration-sdk-core';
import { IntegrationConfig } from '../../../../src/config';

export const accessSpec: StepSpec<IntegrationConfig>[] = [
  {
    /**
     * ENDPOINT: https://api.orcasecurity.io/api/organization/users
     * PATTERN: Fetch Entities
     */
    id: 'fetch-users',
    name: 'Fetch Users',
    entities: [
      {
        resourceName: 'User',
        _type: 'orca_user',
        _class: ['User'],
      },
    ],
    relationships: [
      {
        _type: 'orca_account_has_user',
        sourceType: 'orca_account',
        _class: RelationshipClass.HAS,
        targetType: 'orca_user',
      },
    ],
    dependsOn: ['fetch-account'],
    implemented: true,
  },
  {
    /**
     * ENDPOINT: https://api.orcasecurity.io/api/rbac/group
     * PATTERN: Fetch Entities
     */
    id: 'fetch-groups',
    name: 'Fetch Groups',
    entities: [
      {
        resourceName: 'UserGroup',
        _type: 'orca_group',
        _class: ['UserGroup'],
      },
    ],
    relationships: [
      {
        _type: 'orca_account_has_group',
        sourceType: 'orca_account',
        _class: RelationshipClass.HAS,
        targetType: 'orca_group',
      },
    ],
    dependsOn: ['fetch-account'],
    implemented: true,
  },
  {
    /**
     * ENDPOINT: https://api.orcasecurity.io/api/rbac/role
     * PATTERN: Fetch Roles
     */
    id: 'fetch-roles',
    name: 'Fetch Roles',
    entities: [
      {
        resourceName: 'Role',
        _type: 'orca_role',
        _class: ['AccessRole'],
      },
    ],
    relationships: [
      {
        _type: 'orca_user_assigned_role',
        sourceType: 'orca_user',
        _class: RelationshipClass.ASSIGNED,
        targetType: 'orca_role',
      },
    ],
    dependsOn: ['fetch-account'],
    implemented: true,
  },
  {
    /**
     * ENDPOINT: n/a
     * PATTERN: Build Child Relationships
     */
    id: 'build-user-group-relationships',
    name: 'Build Group -> User Relationships',
    entities: [],
    relationships: [
      {
        _type: 'orca_group_has_user',
        sourceType: 'orca_group',
        _class: RelationshipClass.HAS,
        targetType: 'orca_user',
      },
    ],
    dependsOn: ['fetch-groups', 'fetch-users'],
    implemented: true,
  },
  {
    /**
     * ENDPOINT: n/a
     * PATTERN: Build Child Relationships
     */
    id: 'build-user-role-relationships',
    name: 'Build User -> Role Relationships',
    entities: [],
    relationships: [
      {
        _type: 'orca_user_assigned_role',
        sourceType: 'orca_user',
        _class: RelationshipClass.ASSIGNED,
        targetType: 'orca_role',
      },
    ],
    dependsOn: ['fetch-users', 'fetch-roles'],
    implemented: true,
  },
];
