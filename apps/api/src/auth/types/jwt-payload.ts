export interface JwtPayload {
  /** Subject — the user id. */
  sub: string;
  email: string;
  role: string;
  userType?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string | null;
  role: string;
  userType: string;
  firstName: string | null;
  lastName: string | null;
}
