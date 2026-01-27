import { EntityNotFoundError } from 'typeorm';

export const isEntityNotFoundError = (e: Error): e is EntityNotFoundError =>
  e instanceof EntityNotFoundError;
