export interface TelegramCredentials {
  api_id: number;
  api_hash: string;
  session: string;
}

export type AccountCredentials = TelegramCredentials;
