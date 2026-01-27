import { isQueryFailedError } from './query-failed.type-guard';
import { DatabaseError } from 'pg-protocol';

export const isUniqueConstraintError = (e: Error) =>
  isQueryFailedError<DatabaseError>(e) && e.driverError.code === '23505';
