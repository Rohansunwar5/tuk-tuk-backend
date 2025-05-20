declare namespace Express {
  export interface Request {
    driver: {
      _id: string;
      tokenType?: 'access' | 'refresh';
    };
    tempAuth?: {
      phoneNumber: string;
    }
  }
}