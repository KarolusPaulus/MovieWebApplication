import fs from 'fs';
import path from 'path';
import { pool } from './db.js'
import { hash } from 'bcrypt'
import jwt from 'jsonwebtoken'

const { sign } = jwt
const __dirname = path.resolve();

const initializeTestDb = async () => {
    const sql = fs.readFileSync(path.resolve(__dirname,'../server/movieAppDb.sql'),"utf8");
    await pool.query(sql)
}

const insertTestUser = async (email, password) => {
    try {
        // Edited to return the user_id correctly for movie review test (other tests pass as well!)
        const hashedPassword = await hash(password, 10)

        const result = await pool.query(
            'INSERT INTO Users (email, password_hash) VALUES ($1, $2) RETURNING user_id',
            [email, hashedPassword]
          )
          return result.rows[0]
    }
    catch (error) {
        console.error(err)
        throw error
      }
}

const insertTestReview = async (movieId, userId, content, rating) => {
    const result = await pool.query(
        'INSERT INTO Reviews (imdb_movie_id, user_id, review_text, rating) VALUES ($1, $2, $3, $4) RETURNING review_id',
        [movieId, userId, content, rating]
      )
    return result.rows[0]
}

const getToken = (email) => {
    return sign({user: email},process.env.JWT_SECRET_KEY)
}

export { initializeTestDb, insertTestUser, getToken, insertTestReview }