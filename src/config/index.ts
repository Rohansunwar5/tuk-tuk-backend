/* eslint-disable @typescript-eslint/no-non-null-assertion */
import dotenv from 'dotenv';
dotenv.config();

console.log('AWS Config from ENV:', {
  region: process.env.AWS_REGION,
  accessKey: process.env.AWS_ACCESS_KEY_ID?.substring(0, 4),
  secretKey: process.env.AWS_SECRET_ACCESS_KEY?.substring(0, 4)
});

const config = {
  MONGO_URI: process.env.MONGO_URI! as string,
  NODE_ENV: process.env.NODE_ENV! as string,
  REDIS_HOST: process.env.REDIS_HOST! as string,
  REDIS_PORT: process.env.REDIS_PORT! as string,
  PORT: process.env.PORT! as string,
  JWT_SECRET: process.env.JWT_SECRET! as string,
  DEVICE_JWT_SECRET: process.env.DEVICE_JWT_SECRET! as string,
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY! as string,
  AWS_REGION: process.env.AWS_REGION! as string,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID! as string,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY! as string,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME! as string,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID! as string,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET! as string,
  RAZORPAY_SETTLEMENT_ACCOUNT: process.env.RAZORPAY_SETTLEMENT_ACCOUNT! as string,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET! as string,
  

  SERVER_NAME: `${process.env.SERVER_NAME}-${process.env.NODE_ENV}`! as string,
  JWT_CACHE_ENCRYPTION_KEY: process.env.JWT_CACHE_ENCRYPTION_KEY! as string,
  DEFAULT_COUNTRY_CODE: 'IN',
};

export default config;
