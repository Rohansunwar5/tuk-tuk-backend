declare namespace Express {
  export interface Request {
    user: {
      _id: string;
      email: string;
      twoFactorEnabled?: boolean;
    };
    tempTokenPayload: {
      _id: string;
      requires2FA: boolean;
    };
  }
}