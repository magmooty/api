export interface UserExtraAttirbutes {
  roles: string[];
}

export interface LoginResult {
  token: string;
  refresh_token: string;
}

export interface AuthDriver {
  login(username: string, password: string): Promise<LoginResult>;
  register(
    username: string,
    password: string,
    extraAttributes: UserExtraAttirbutes
  ): Promise<LoginResult>;
}
