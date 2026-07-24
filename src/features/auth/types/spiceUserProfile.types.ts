export interface SpiceUserProfileRole {
  id: number;
  name: string;
  level: number | null;
  groupName: string;
  displayName: string;
  suiteAccessName: string;
  appTypes: string[];
  reportPrivileges: unknown[];
}

export interface SpiceUserProfileEntity {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  tenantId: number;
  defaultRoleName: string | null;
  suiteAccess: string[];
  roles: SpiceUserProfileRole[];
}

export interface SpiceUserProfileResponse {
  message: string;
  entity: SpiceUserProfileEntity;
  status: boolean;
  responseCode: number;
}
