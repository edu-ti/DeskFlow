const { Client } = require('pg');
const client = new Client({
  user: 'deskflow',
  host: 'localhost',
  database: 'deskflow_db',
  password: 'deskflow_password',
  port: 5434, // using the mapped port from docker ps
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT id, email FROM users');
  console.log(res.rows);
  
  // Update password to admin123
  await client.query("UPDATE users SET password_hash='$2b$10$0q9CYFv/2qJ7YPoGAWbN3udXFIrOb9WEm0B84CmtHefT9Q3kT2FS.' WHERE email='admin@example.com'");
  
  // Link role
  try {
    await client.query("INSERT INTO user_roles (\"usersId\", \"rolesId\") VALUES (1, 1)");
    console.log("Linked admin role (1) to user (1)");
  } catch(e) {
    console.log("Error or already linked:", e.message);
  }
  
  await client.end();
}

run().catch(console.error);
