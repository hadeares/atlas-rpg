import { UserRole } from '../database/entities/user.entity';

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
}
