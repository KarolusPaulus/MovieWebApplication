// Router for Web_sovellus_DB_template1 database (please rename to something :D)
// This router is used to handle all the requests to the Web_sovellus_DB_template1 database

import { pool } from '../helpers/db.js';
import { Router } from 'express';
import { emptyORows } from '../helpers/utils.js';

const router = Router();

router.get('/', (req, res, next) => {
    pool.query('select * from Users', (error, results) => {
        if (error) {
        return next(error)
        }
        res.status(200).json(emptyORows(results));
    });
});

router.post('/create', (req, res) => {
    pool.query('INSERT INTO Users (user_id, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [req.body.user_id, req.body.email, req.body.password_hash],
      (error, result) => {
        if (error) {
          return res.status(500).json({ error: error.message });
        }
        res.status(200).json(result.rows[0]);
      }
    );
  });

  export default router;