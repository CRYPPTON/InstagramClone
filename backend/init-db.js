const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function initDb() {
  const dbConfig = {
    user: 'enterwait_user',
    host: 'localhost',
    database: 'instagram_clone_db',
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

  const client = new Client(dbConfig);

  try {
    await adminClient.connect();
    const res = await adminClient.query(`SELECT 1 FROM pg_database WHERE datname = '${dbConfig.database}'`);
    if (res.rowCount === 0) {
      console.log(`Database ${dbConfig.database} not found, creating it...`);
      await adminClient.query(`CREATE DATABASE ${dbConfig.database}`);
      console.log(`Database ${dbConfig.database} created successfully.`);
    } else {
      console.log(`Database ${dbConfig.database} already exists.`);
    }
  } catch (err) {
    console.error('Error creating database:', err);
    process.exit(1);
  } finally {
    await adminClient.end();
  }

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database.');


    const schemaDir = path.join(__dirname, '../database');
    const schemaPath = path.join(schemaDir, 'schema.sql');

    if (!fs.existsSync(schemaDir)) {
      console.log(`Creating directory: ${schemaDir}`);
      fs.mkdirSync(schemaDir);
    }

    if (!fs.existsSync(schemaPath)) {
      console.log(`Creating empty schema file: ${schemaPath}`);
      fs.writeFileSync(schemaPath, ''); // Create an empty schema.sql if it doesn't exist
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);
    console.log('Schema applied successfully.');

  } catch (err) {
    console.error('Error connecting to or initializing database:', err);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

initDb();
