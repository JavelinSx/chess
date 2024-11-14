// server/types/google.ts
export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  id_token?: string;
  token_type: string;
  refresh_token?: string;
}

export interface GoogleUser {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
  hd?: string;
}

export interface GoogleAuthState {
  state: string;
}
