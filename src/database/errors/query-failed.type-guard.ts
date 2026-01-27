import { QueryFailedError } from 'typeorm';

export const isQueryFailedError = <T extends Error>(
  e: Error,
): e is QueryFailedError<T> => e instanceof QueryFailedError;
