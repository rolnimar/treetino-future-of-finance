import { Injectable } from '@nestjs/common';
import { fileURLToPath } from 'node:url';

@Injectable()
export class DatabaseConfig {
  readonly url =
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@127.0.0.1:5468/treetino_future_of_finance';
  readonly schema = 'public';
  // Resolves identically from src/database and dist/database, independent of cwd.
  readonly migrationsFolder = fileURLToPath(
    new URL('../../migrations/', import.meta.url),
  );
}
