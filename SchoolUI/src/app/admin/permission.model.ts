export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

export interface ResourcePermission {
  resource: string;
  icon: string;
  permissions: {
    action: string;
    label: string;
    description: string;
    checked: boolean;
  }[];
}
