const { Client } = require('pg');
const client = new Client({
  user: 'deskflow',
  host: 'localhost',
  database: 'deskflow_db',
  password: 'deskflow_password',
  port: 5434
});

client.connect()
  .then(() => client.query('SELECT u.email, r.name FROM users u LEFT JOIN user_roles ur ON u.id = ur."userId" LEFT JOIN roles r ON ur."roleId" = r.id;'))
  .then(res => {
    console.table(res.rows);
    return client.end();
  })
  .catch(console.error);
