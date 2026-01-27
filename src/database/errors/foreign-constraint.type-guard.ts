import { isQueryFailedError } from './query-failed.type-guard';
import { DatabaseError } from 'pg-protocol';

export const isForeignKeyConstraintError = (e: Error) =>
  isQueryFailedError<DatabaseError>(e) && e.driverError.code === '23503';
