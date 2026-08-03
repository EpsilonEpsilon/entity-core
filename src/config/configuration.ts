import * as process from 'node:process';

export const configuration = () => ({
  database: {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT || 5432,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
  },
  ai: {
    gemini: process.env.GEMINI_API_KEY,
  },
  telegram: {
    apiId: process.env.TELEGRAM_APP_ID,
    apiHash: process.env.TELEGRAM_API_HASH,
  },
});
