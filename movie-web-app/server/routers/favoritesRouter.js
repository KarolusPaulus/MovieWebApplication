import { auth } from '../helpers/auth.js';
import { pool } from '../helpers/db.js';
import { Router } from 'express';
import { emptyORows } from '../helpers/utils.js';

const favoritesRouter = Router()

// Favorite a movie
favoritesRouter.post('/:movieId', auth, async (req, res, next) => {
    const { movieId } = req.params;
    const email = req.user.email;
  
    if (!/^\d+$/.test(movieId)) {
        return res.status(400).json({ error: 'Invalid movie ID. Only numeric values are allowed.' })
    }

    try {
      const userIdQuery = 'SELECT user_id FROM Users WHERE email = $1'
      const userResult = await pool.query(userIdQuery, [email])
  
      if (userResult.rowCount === 0) {
        return res.status(404).json({ error: 'User not found' })
      }
  
      const userId = userResult.rows[0].user_id
  
      const insertQuery = 'INSERT INTO Favorites (user_id, imdb_movie_id) VALUES ($1, $2) ON CONFLICT DO NOTHING'
      const result = await pool.query(insertQuery, [userId, movieId])
  
      if (result.rowCount === 0) {
        return res.status(409).json({ message: 'Movie is already in favorites' })
      }
  
      return res.status(201).json({ message: 'Movie added to favorites' })
    } catch (err) {
      return next(err)
    }
})  
  
// GET favorite movies
favoritesRouter.get('/', auth, async (req, res, next) => {
    const email = req.user.email
  
    try {
      const userIdQuery = 'SELECT user_id FROM Users WHERE email = $1'
      const userResult = await pool.query(userIdQuery, [email])
      if (userResult.rowCount === 0) {
        return res.status(404).json({ error: 'User not found' })
      }
      const userId = userResult.rows[0].user_id
  
      const selectQuery = 'SELECT imdb_movie_id FROM Favorites WHERE user_id = $1'
      const result = await pool.query(selectQuery, [userId])
  
      return res.status(200).json({
        favorites: result.rows.map(row => row.imdb_movie_id)
      })
    } catch (err) {
      return next(err)
    }
})
  
// DELETE a movie from favorites
favoritesRouter.delete('/:movieId', auth, async (req, res, next) => {
    const { movieId } = req.params
    const email = req.user.email
  
    try {
      const userIdQuery = 'SELECT user_id FROM Users WHERE email = $1'
      const userResult = await pool.query(userIdQuery, [email])
      if (userResult.rowCount === 0) {
        return res.status(404).json({ error: 'User not found' })
      }
      const userId = userResult.rows[0].user_id;
  
      const deleteQuery = 'DELETE FROM Favorites WHERE user_id = $1 AND imdb_movie_id = $2'
      await pool.query(deleteQuery, [userId, movieId]);
  
      return res.status(200).json({ message: 'Movie removed from favorites' })
    } catch (err) {
      return next(err)
    }
})

favoritesRouter.get('/:email', async (req, res) => {
  const { email } = req.params
  
  try {
      const userIdQuery = 'SELECT user_id FROM Users WHERE email = $1'
      const userResult = await pool.query(userIdQuery, [email])

      if (userResult.rowCount === 0) {
          return res.status(404).json({ error: 'User not found' })
      }

      const userId = userResult.rows[0].user_id

      const selectQuery = 'SELECT imdb_movie_id FROM Favorites WHERE user_id = $1'
      const result = await pool.query(selectQuery, [userId])

      return res.status(200).json({
          favorites: result.rows.map(row => row.imdb_movie_id),
      })
  } catch (err) {
      return next(err)
  }
})

export default favoritesRouter