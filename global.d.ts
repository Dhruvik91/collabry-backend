import { PayloadDataResponse } from 'src/modules/auth/types/types';

declare global {
  namespace Express {
    export interface Request {
      user: PayloadDataResponse;
    }
  }
}
