import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BinaryLike,
  createCipheriv,
  createDecipheriv,
  scryptSync,
} from 'crypto';

@Injectable()
export class EncryptionService {
  private KEY: BinaryLike;
  private readonly IV: BinaryLike;

  private readonly ALGORITHM: string = 'aes-256-ctr';

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {
    const password = this.configService.get<string>('ENCRYPTION_PASSWORD');
    const salt = this.configService.get<string>('ENCRYPTION_SALT');
    this.KEY = scryptSync(password, salt, 32);
    this.IV = this.configService.get<string>('ENCRYPTION_IV');
  }

  encryptData(data: string): string {
    const cipher = createCipheriv(this.ALGORITHM, this.KEY, this.IV);
    const encryptedText = Buffer.concat([cipher.update(data), cipher.final()]);
    return encryptedText.toString('base64url');
  }

  decryptData(encryptedText: string): string {
    const decipher = createDecipheriv(this.ALGORITHM, this.KEY, this.IV);
    const decryptedText = Buffer.concat([
      decipher.update(Buffer.from(encryptedText, 'base64url')),
      decipher.final(),
    ]);
    return decryptedText.toString('utf-8');
  }
}
