export interface User {
  id: string;
  userName: string;
  fullName?: string;
  email: string;
  imageUrl?: string | null;
  phoneNumber?: string;
  password?: string; // Only used for editing, not displayed
  lockoutEnd?: string;
  createdAt?: string;
  roles?: string[];
}
