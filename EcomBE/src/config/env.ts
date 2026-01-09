import dotenv from 'dotenv';

dotenv.config();

export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV ,
  PORT: process.env.PORT,

  // Database
  DATABASE_URL: process.env.DATABASE_URL ,

  // Redis
  REDIS_URL: process.env.REDIS_URL ,

  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN ,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ,

  CLOUDINARY_URL: process.env.CLOUDINARY_URL ,

  VNPAY_TMN_CODE: process.env.VNPAY_TMN_CODE ,
  VNPAY_HASH_SECRET: process.env.VNPAY_HASH_SECRET ,

  MEILI_HOST: process.env.MEILI_HOST,
  MEILI_API_KEY: process.env.MEILI_API_KEY,

  FRONTEND_URL: process.env.FRONTEND_URL
};

// Validate required env variables
const requiredEnvVars = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'CLOUDINARY_URL',
  'VNPAY_TMN_CODE',
  'VNPAY_HASH_SECRET',
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

