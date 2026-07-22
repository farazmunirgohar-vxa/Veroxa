/** Minimal Cloudflare runtime bindings used by this project.
 *
 * These declarations keep the application strictly type-checked without
 * coupling the repository to a separately installed ambient-types package.
 * The runtime bindings themselves are supplied by the Sites/Workers host.
 */
interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(columnName?: string): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  raw<T extends unknown[] = unknown[]>(): Promise<T[]>;
}

interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  error?: string;
  meta: Record<string, unknown>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<Array<D1Result<T>>>;
  exec(query: string): Promise<{ count: number; duration: number }>;
  dump(): Promise<ArrayBuffer>;
}

declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
  };
}
