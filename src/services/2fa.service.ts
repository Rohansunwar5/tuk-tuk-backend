import { 
  generateTOTP,
  verifyTOTP,
  generateTOTPSecret,
  generateTOTPURI,
  generateHOTP
} from './crypto.service';
import { generateQRCodeSVG } from '../utils/qrUtils';

class TwoFactorAuthService {

  // Generate new 2FA setup (secret + QRCODE)
  async setup2FA(email: string) {
    const secret = generateTOTPSecret();
    const uri = generateTOTPURI(secret, email, 'workplaydigital');
    const qrCode = generateQRCodeSVG(uri);
    
    return {
      secret, 
      qrCode  
    };
  }

  // Varifying a 2FA code during setup 
  async verifySetupCode(secret: string, code: string): Promise<boolean> {
    const counter = Math.floor(Date.now() / 1000 / 30);
    console.log('Current counter:', counter);
    console.log('Valid codes around this time:');
    
    // Log valid codes in a 2-minute window
    for (let i = counter - 2; i <= counter + 2; i++) {
      const validCode = generateHOTP(secret, i);
      console.log(`Counter ${i}: ${validCode}`);
    }
  
    return verifyTOTP(code, secret, 30, 3);
  }

  // verifyong 2FA code during login 
  async verifyLoginCode(secret: string, code: string): Promise<boolean> {
    return verifyTOTP(code, secret);
  }

  // Generate a 2FA code (for testing)
  async generateCode(secret: string): Promise<string> {
    return generateTOTP(secret);
  }

  async getCurrentCode(secret: string): Promise<string> {
    return generateTOTP(secret);
  }
}

export default new TwoFactorAuthService();