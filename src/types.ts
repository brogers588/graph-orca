export interface OrcaUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface OrcaGroup {
  id: string;
  name: string;
  description?: string;
  sso_group: boolean;
  users: { id: string }[];
}

export interface OrcaRole {
  id: string;
  name: string;
}

export interface OrcaUserWithRole {
  user: OrcaUser;
  role: OrcaRole;
}

// /api/organization/users
export interface OrcaOrganizationUsersResponse {
  status: string;
  data: {
    name: string;
    users: {
      user_id: string;
      email: string;
      first: string;
      last: string;
    }[];
  };
}

// /api/rbac/access/user
export interface OrcaAccessUsersResponse {
  status: string;
  data: {
    id: string;
    user: OrcaUser;
    role: OrcaRole;
  }[];
}

// /api/rbac/group
export interface OrcaGroupsResponse {
  status: string;
  data: {
    groups: Omit<OrcaGroup, 'users'>[];
  };
}

// /api/rbac/group/<id>
export interface OrcaGroupResponse {
  status: string;
  data: {
    group: string;
    description?: string;
    all_users: boolean;
    users: {
      id: string;
    }[];
  };
}

// /api/rbac/role
export interface OrcaRolesResponse {
  status: string;
  data: OrcaRole[];
}

// /api/user/session
export interface OrcaUserSessionResponse {
  status: string;
  role: string;
  need_to_sign: boolean;
  jwt: {
    refresh: string;
    access: string;
  };
}
