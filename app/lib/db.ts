import { Pool } from 'pg';

export const pool = new Pool({
    user: process.env.PG_USER, // replace with your database user
    host: process.env.PG_HOST, // replace with your database host
    database: process.env.PG_DATABASE, // replace with your database name
    password: process.env.PG_PASSWORD, // replace with your database password
    port: Number(process.env.PG_PORT), // default PostgreSQL port
});

