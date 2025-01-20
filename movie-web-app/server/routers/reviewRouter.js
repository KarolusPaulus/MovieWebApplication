import { Router } from 'express';
import { pool } from '../helpers/db.js';
import { auth } from '../helpers/auth.js';
import { getUserIdByEmail } from '../helpers/userUtils.js';

const reviewRouter = Router()

// GET local reviews
reviewRouter.get('/:movieId', (req, res, next) => {
  const movieId = req.params.movieId
  
  if (!/^\d+$/.test(movieId)) {
    return res.status(400).json({ error: 'Invalid movie ID. Only numeric values are allowed.' })
  }

  const values = [movieId]

  const query = `
    SELECT r.review_id, r.review_text, r.rating, u.email AS author, r.created_at
    FROM Reviews r
    JOIN Users u ON r.user_id = u.user_id
    WHERE r.imdb_movie_id = $1;`

  pool.query(query, values)
    .then(result => {
      //console.log(result.rows)
      res.json({
        reviews: result.rows.map(row => ({
          id: row.review_id,
          author: row.author,
          content: row.review_text,
          rating: row.rating,
          createdAt: row.created_at
        }))
      })
    })
    .catch(err => {
      console.error('Error fetching reviews from local database.', err)
      return next(err)
    })
})

// POST review
reviewRouter.post('/:movieId', auth, async (req, res, next) => {
    const { review_text, imdb_movie_id, rating } = req.body
    const email = req.user.email

    if (!email || !review_text || !imdb_movie_id || !rating) {
        return res.status(400).json({ error: 'Missing required fields' })
    }

    try {
        const user_id = await getUserIdByEmail(email)
        // Check for existing review
        const existingReview = await pool.query(
            `SELECT * FROM reviews WHERE user_id = $1 AND imdb_movie_id = $2`,
            [user_id, imdb_movie_id]
        )

        if (existingReview.rowCount > 0) {
            // Update existing review (mostly used in testing)
            await pool.query(
                `UPDATE reviews SET review_text = $1, rating = $2 WHERE user_id = $3 AND imdb_movie_id = $4 RETURNING *`,
                [review_text, rating, user_id, imdb_movie_id]
            )
            return res.status(201).send()
        } else {
            await pool.query(
                `INSERT INTO reviews (user_id, imdb_movie_id, rating, review_text) VALUES ($1, $2, $3, $4) RETURNING *`,
                [user_id, imdb_movie_id, rating, review_text]
            )
            return res.status(201).send()
        }
    } catch (err) {
      return next(err)
    }
})

// DELETE review
reviewRouter.delete('/:reviewId', auth, async (req, res, next) => {
  const { reviewId } = req.params
  const email = req.user.email

  try {
    const userId = await getUserIdByEmail(email)
    const review = await pool.query('SELECT * FROM Reviews WHERE review_id = $1 AND user_id = $2', [reviewId, userId])

    if (review.rowCount === 0) {
      return res.status(403).json({ message: 'You are not authorized to delete this review.' })
    }

    await pool.query('DELETE FROM Reviews WHERE review_id = $1', [reviewId])
    res.status(200).send()
  } catch (err) {
    next(err)
  }
})

export default reviewRouter