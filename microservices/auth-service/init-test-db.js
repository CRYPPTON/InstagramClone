const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function initTestDb() {
  const dbConfig = {
    user: 'enterwait_user',
    host: 'localhost',
    database: 'instagram_clone_db_test',
    password: 'enterwait_dev_2024',
    port: 5433,
  };

  const adminClient = new Client({
    user: dbConfig.user,
    host: dbConfig.host,
    database: 'postgres',
    password: dbConfig.password,
    port: dbConfig.port,
  });

  try {
    await adminClient.connect();
    const res = await adminClient.query(`SELECT 1 FROM pg_database WHERE datname = '${dbConfig.database}'`);
    if (res.rowCount > 0) {
        // Must disconnect from all connections before dropping
        await adminClient.query(`SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${dbConfig.database}' AND pid <> pg_backend_pid()`);
        await adminClient.query(`DROP DATABASE ${dbConfig.database}`);
    }
    await adminClient.query(`CREATE DATABASE ${dbConfig.database}`);
  } catch (err) {
    console.error('Error creating database:', err);
    process.exit(1);
  } finally {
    await adminClient.end();
  }

  const client = new Client(dbConfig);
  try {
    await client.connect();
    const schemaSql = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
    await client.query(schemaSql);
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initTestDb().then(() => console.log('Test DB initialized'));
