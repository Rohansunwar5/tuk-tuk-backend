import AWS from 'aws-sdk';
import config from '../config';

export const s3 = new AWS.S3({
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  },
  region: config.AWS_REGION
});