import { randomBytes } from 'node:crypto'; 

export class MFAPolicy {
    static createBackupCodes(count = 10) {
      return Array.from({ length: count }, () => 
        randomBytes(8) 
          .toString('hex')
          .toUpperCase()
          .match(/.{4}/g)
          ?.join('-')
      ).filter(Boolean) as string[];
    }
}
