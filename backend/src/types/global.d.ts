declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    NODE_ENV?: 'development' | 'production' | 'test';
    SUPABASE_URL: string;
    SUPABASE_SERVICE_KEY: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN?: string;
  }
}

interface Error {
  statusCode?: number;
}