export interface VKAuthResponse {
  code: string;
  state: string;
}

export interface VKTokenResponse {
  access_token: string;
  expires_in: number;
  user_id: number;
  email?: string;
}

export interface VKUserResponse {
  response: Array<{
    id: number;
    first_name: string;
    last_name: string;
    photo_100?: string;
    email?: string;
  }>;
}
