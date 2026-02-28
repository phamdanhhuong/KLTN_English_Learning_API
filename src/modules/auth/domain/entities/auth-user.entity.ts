export class AuthUser {
  id: string;
  email: string;
  password: string | null;
  roleId: string;
  googleId: string | null;
  facebookId: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  role?: Role;

  constructor(partial?: Partial<AuthUser>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  get isOAuthUser(): boolean {
    return !!(this.googleId || this.facebookId);
  }

  get hasPassword(): boolean {
    return !!this.password;
  }
}

export class Role {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial?: Partial<Role>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
