export interface Role {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
  permissions: string[];
  isSystem?: boolean;
}

export interface ResourcePermission {
  resource: string;
  icon: string;
  actions: {
    id: string;
    name: string;
    description: string;
    checked: boolean;
  }[];
}
