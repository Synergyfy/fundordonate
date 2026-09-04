import api from "@/lib/api";

interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  role: string;
  userType: string;
  businessId?: string | null;
  emailVerified: boolean;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export const authApi = {
  async register(data: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
    userType?: "donor" | "fundraiser";
  }): Promise<AuthResponse> {
    const res = await api.post("/auth/register", data);
    return res.data.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await api.post("/auth/login", { email, password });
    return res.data.data;
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const res = await api.post("/auth/refresh", { refreshToken });
    return res.data.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post("/auth/logout", { refreshToken });
  },

  async getMe(): Promise<{ user: User }> {
    const res = await api.get("/auth/me");
    return res.data.data;
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post("/auth/forgot-password", { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await api.post("/auth/reset-password", { token, password });
  },

  async verifyEmail(token: string): Promise<void> {
    await api.post("/auth/verify-email", { token });
  },

  async resendVerification(): Promise<void> {
    await api.post("/auth/resend-verification");
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post("/auth/change-password", { currentPassword, newPassword });
  },

  async logoutAll(): Promise<void> {
    await api.post("/auth/logout-all");
  },
};
