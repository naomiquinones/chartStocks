import pg from 'pg';

const pool = new pg.Pool({ /* the connection string goes here */ });

export default pool;