const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function seed() {
  const hash = await bcrypt.hash('admin123', 10);
  
  const client = new Client({
    user: 'deskflow',
    host: 'localhost',
    database: 'deskflow_db',
    password: 'deskflow_password',
    port: 5434,
  });

  await client.connect();
  
  // Clean users table to be safe
  await client.query('TRUNCATE users CASCADE');
  await client.query('TRUNCATE groups CASCADE');

  await client.query(`
    INSERT INTO groups (name) VALUES ('Admin Group')
  `);

  await client.query(`
    INSERT INTO users (login, firstname, lastname, email, password_hash)
    VALUES ('admin', 'Admin', 'User', 'admin@example.com', $1)
  `, [hash]);

  console.log('Admin user seeded with valid bcrypt password!');
  await client.end();
}

seed().catch(console.error);
