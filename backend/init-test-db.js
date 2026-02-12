const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function initTestDb() {
  const dbConfig = {
    user: 'enterwait_user',
    host: 'localhost',
    database: 'instagram_clone_db_test',
    password: 'enterwait_dev_2024',
    port: 5432,
  };

  const adminClient = new Client({
    user: dbConfig.user,
    host: dbConfig.host,
    database: 'postgres', // Connect to default database for creation
    password: dbConfig.password,
    port: dbConfig.port,
  });

  try {
    await adminClient.connect();
    const res = await adminClient.query(`SELECT 1 FROM pg_database WHERE datname = '${dbConfig.database}'`);
    if (res.rowCount > 0) {
        console.log(`Database ${dbConfig.database} found, dropping it...`);
        await adminClient.query(`DROP DATABASE ${dbConfig.database}`);
    }
    console.log(`Creating database ${dbConfig.database}...`);
    await adminClient.query(`CREATE DATABASE ${dbConfig.database}`);
    console.log(`Database ${dbConfig.database} created successfully.`);

  } catch (err) {
    console.error('Error creating database:', err);
    process.exit(1);
  } finally {
    await adminClient.end();
  }

  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Connected to PostgreSQL test database.');

    const schemaSql = fs.readFileSync(path.join(__dirname, 'database/test-schema.sql'), 'utf8');
    await client.query(schemaSql);
    console.log('Test schema applied successfully.');

    const dataSql = fs.readFileSync(path.join(__dirname, 'database/test-data.sql'), 'utf8');
    await client.query(dataSql);
    console.log('Test data inserted successfully.');

  } catch (err) {
    console.error('Error connecting to or initializing test database:', err);
  } finally {
    await client.end();
    console.log('Test database connection closed.');
  }
}

initTestDb();
