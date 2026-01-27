import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HashingService {
  private SALT = 10;

  /**
   * Function to hash password
   * @param password
   * @returns {Promise<string>}
   */

  async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT);
  }

  /**
   * Function to compare password
   * @param password
   * @param hashedPassword
   * @returns
   */

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
}
