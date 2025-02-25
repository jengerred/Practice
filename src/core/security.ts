import { randomBytes } from 'node:crypto';

export class MFAPolicy {
  static createBackupCodes(count = 10): string[] {
    return Array.from({ length: count }, () => 
      randomBytes(8)
        .toString('hex')
        .toUpperCase()
        .match(/.{4}/g)
        ?.join('-') || ''
    ).filter(Boolean) as string[];
  }

  // Add missing method
  static validateCodeFormat(code: string): boolean {
    return /^\d{6}$/.test(code);
  }

  static rateLimiter() {
    return {
      points: 5,
      duration: 60 * 15
    };
  }
}
