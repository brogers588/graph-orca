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

export interface OrcaAsyncDownloadResponse {
  method: 'async';
  request_token: string;
  version: string;
  status: string;
}

export interface OrcaAsyncDownloadStatusResponse {
  status: string;
  query_status: string;
  file_location?: string;
}

export interface OrcaAsset {
  asset_unique_id: string;
  asset_name: string;

  group_type: string;
  cluster_type: string;
  asset_category: string;
  cloud_vendor_id: string;
  cloud_provider: string;
  cloud_provider_id: string;
  asset_vendor_id: string;
  asset_state: string; // 'enabled', 'running'
  level: number;
  cluster_unique_id: string;
  cluster_name: string;
  organization_id: string;
  account_name: string;
  asset_type: string;
}

export interface OrcaCVE {
  cve_id: string;
  asset_unique_id: string;
  type: string;
  score: number;
  context: string;
  nvd: {
    cvss2_severity: string;
    cvss2_score: number;
    cvss3_severity: string;
    cvss3_vector: string;
    cvss3_score: number;
    cvss2_vector: string;
  };
  vendor_source_link: string;
  level: number;
  fix_available_state: 'Yes' | 'No';
  published: string;
  labels: string[];
  asset_type: string;
  summary: string;
  severity: string;
  group_type: string;
  cluster_type: string;
  asset_category: string;
  cloud_vendor_id: string;
  asset_distribution_name: string;
  cloud_provider: string;
  asset_vendor_id: string;
}

export interface OrcaResponse<T> {
  status: string;
  version: string;
  total_items: number;
  total_ungrouped_items: number;
  data_grouped: boolean;
  total_supported_items: number;
  next_page_token?: string;
  data: T;
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

// /api/assets
export interface OrcaAssetsResponse {
  status: string;
  data: OrcaAsset[];
}

// /api/cve
export interface OrcaCVEsResponse {
  status: string;
  data: OrcaCVE[];
}
