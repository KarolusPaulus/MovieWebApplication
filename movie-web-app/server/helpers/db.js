import pkg from 'pg'
import dotenv from 'dotenv'

const environment = process.env.NODE_ENV
dotenv.config()

const { Pool } = pkg

const openDb = () => {
    const pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: environment === 'development' ? process.env.DB_NAME : process.env.TEST_DB_NAME,
      password: process.env.DB_PASSWORD,
      port : process.env.DB_PORT,
      ssl: {
        rejectUnauthorized: false,  // Disable SSL certificate verification for connection
      }
    })
    return pool
  }

  const pool = openDb()

  pool.on('connect', () => {
    console.log('Connected to database!')
  })
  
  pool.on('error', (err) => {
    console.error(err)
    process.exit(-1)
  })

  export { pool }