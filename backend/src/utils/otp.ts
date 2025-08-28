import crypto from 'crypto';

export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    otp += digits[randomIndex];
  }
  
  return otp;
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function isOTPExpired(createdAt: Date, expiryMinutes: number = 10): boolean {
  const now = new Date();
  const diff = now.getTime() - createdAt.getTime();
  const diffMinutes = Math.floor(diff / 1000 / 60);
  
  return diffMinutes > expiryMinutes;
}