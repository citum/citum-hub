import pg from 'pg';
import { env } from '$env/dynamic/private';

const { Pool } = pg;

export const pool = new Pool({
    connectionString: env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/stylehub'
});
