export type ErrorTransformer = (error: Error) => Error;

export const cif =
  (predicate: (e: Error) => boolean, handler: Error | ErrorTransformer) =>
  (e: Error): never => {
    if (!predicate(e)) throw e;

    if (handler instanceof Error) throw handler;

    throw handler(e);
  };
