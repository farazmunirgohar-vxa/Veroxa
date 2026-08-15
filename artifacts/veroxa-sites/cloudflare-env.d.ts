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

interface R2Checksums {
  md5?: ArrayBuffer;
  sha1?: ArrayBuffer;
  sha256?: ArrayBuffer;
  sha384?: ArrayBuffer;
  sha512?: ArrayBuffer;
}

interface R2Object {
  key: string;
  version: string;
  size: number;
  etag: string;
  uploaded: Date;
  httpMetadata?: {
    contentType?: string;
    contentDisposition?: string;
    cacheControl?: string;
  };
  customMetadata?: Record<string, string>;
  checksums: R2Checksums;
}

interface R2ObjectBody extends R2Object {
  arrayBuffer(): Promise<ArrayBuffer>;
}

interface R2Bucket {
  head(key: string): Promise<R2Object | null>;
  get(key: string): Promise<R2ObjectBody | null>;
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | Blob | ReadableStream | string,
    options?: {
      onlyIf?: Headers | {
        etagMatches?: string;
        etagDoesNotMatch?: string;
      };
      httpMetadata?: {
        contentType?: string;
        contentDisposition?: string;
        cacheControl?: string;
      };
      customMetadata?: Record<string, string>;
      sha256?: ArrayBuffer | string;
    },
  ): Promise<R2Object | null>;
}

interface VeroxaImagesTransformResult {
  response(): Response;
}

interface VeroxaImagesInput {
  transform(options: Record<string, unknown>): VeroxaImagesInput;
  output(options: {
    format: string;
    quality?: number;
  }): Promise<VeroxaImagesTransformResult>;
}

interface VeroxaImagesBinding {
  info(stream: ReadableStream): Promise<{
    width: number;
    height: number;
    format: string;
    fileSize: number;
  }>;
  input(stream: ReadableStream): VeroxaImagesInput;
}

declare module "cloudflare:workers" {
  export const env: {
    BUCKET?: R2Bucket;
    DB?: D1Database;
    IMAGES?: VeroxaImagesBinding;
  };
}
