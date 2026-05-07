import mysql from 'mysql2/promise';

async function createDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      port: 3306
    });
    
    await connection.query('CREATE DATABASE IF NOT EXISTS simponi;');
    console.log('Database "simponi" created or already exists.');
    await connection.end();
    
    process.exit(0);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
       console.error('ERROR: MySQL Server is not running on localhost:3306.');
    } else {
       console.error('Error creating database:', error.message);
    }
    process.exit(1);
  }
}

createDatabase();
