import { pool} from "../helpers/db.js"
import { Router } from "express"
import { hash,compare } from "bcrypt"
import jwt from "jsonwebtoken"
import { addToBlacklist } from "../helpers/blacklist.js";
import { auth } from "../helpers/auth.js";

const { sign } = jwt

const router = Router()

router.post('/register',(req, res, next) => {
    hash(req.body.password, 10,(error, hashedPassword) => {
        if (error) next(error) // Hash error.
        try {
            pool.query('insert into Users (email,password_hash) values ($1,$2) returning *',
                [req.body.email,hashedPassword],
                (error,result) => {
                    if (error) return next(error) // Database error.
                    return res.status(201).json({
                        user_id: result.rows[0].user_id,
                        email: result.rows[0].email
                    })
                }
            )
        } catch (error) {
    return next(error) 
    }
})
})

router.post('/login', (req, res, next) => {
    const invalid_message = 'Invalid credentials';
    
    try {
        // Query the database to find the user by email
        pool.query('SELECT * FROM Users WHERE email=$1', [req.body.email], (error, result) => {
            if (error) {
                console.error('Database Error:', error); // Log any database errors
                return next(error); // Pass the error to the error handler
            }

            // If no user found with the provided email
            if (result.rowCount === 0) {
                console.warn('No user found with email:', req.body.email); // Log warning
                return res.status(401).json({ error: invalid_message }); // Send 401 Unauthorized
            }

            // Extract the user object from the query result
            const user = result.rows[0];
            console.log('User found:', user); // Log user object to confirm details

            // Compare the provided password with the hashed password in the database
            compare(req.body.password, user.password_hash, (compareError, isMatch) => {
                if (compareError) {
                    console.error('Password Comparison Error:', compareError); // Log comparison errors
                    return next(compareError); // Pass the comparison error to the error handler
                }

                if (!isMatch) {
                    console.warn('Password does not match for user:', req.body.email); // Log warning
                    return res.status(401).json({ error: invalid_message }); // Send 401 Unauthorized
                }

                // Generate a JWT token for the authenticated user
                const token = sign({ user: req.body.email }, process.env.JWT_SECRET_KEY);
                console.log('Login successful for user:', user.email); // Log successful login
                //console.log('JWT Token:', token);
                
                // Return user_id, email, and token in the response
                return res.status(200).json({
                    user_id: user.user_id,
                    email: user.email,
                    token: token,
                });
            });
        });
    } catch (error) {
        console.error('Unexpected Error during login:', error); // Log unexpected errors
        return next(error); // Pass unexpected errors to the error handler
    }
});

router.post('/logout', auth, (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        addToBlacklist(token);
        return res.status(200).json({ message: 'User successfully logged out' });
    } catch (error) {
        return next(error);
    }
});


router.delete('/delete', auth, (req, res, next) => {

    try {
        console.log('Auth middleware user:', req.user); // Debug auth data
        const userEmail = req.user.email;  // This comes from auth middleware
        console.log('Attempting to delete user:', userEmail); // Debug user email

        // First get user_id from email
        pool.query('SELECT user_id FROM Users WHERE email = $1', [userEmail], (error, userResult) => {
            if (error){
                console.error('Database error:', error); // Debug DB errors
             return next(error);
            }
            if (userResult.rowCount === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const userId = userResult.rows[0].user_id;
            console.log('Found user ID:', userId); // Debug user ID
   

            // Check if user owns groups
            pool.query('SELECT * FROM Groups WHERE owner_id = $1', [userId], (error, result) => {
                if (error) return next(error);

                if (result.rowCount > 0) {
                    return res.status(400).json({ 
                        error: 'You must transfer ownership of your groups before deleting your account.' 
                    });
                }

              
                // Delete the user
                pool.query('DELETE FROM Users WHERE user_id=$1', [userId], (deleteError, deleteResult) => {
                    if (deleteError) return next(deleteError);
                    return res.status(200).json({ message: 'User deleted successfully' });
                });
            });
        });
    } catch (error) {
        return next(error);
    }
});

router.get('/email', auth, (req, res, next) => {
    try{      
        return res.status(200).json({ email: req.user.email });
    } catch (error) {
        return next(error);
}
});

/*router.get('/favorites/:email', async (req, res) => {
    const { email } = req.params; // This could be userId or email
    try {
        const favorites = await getUserFavorites(email); // Logic in your controller
        if (!favorites) {
            return res.status(404).json({ message: 'No favorites available.' });
        }
        res.json({ favorites });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching favorites.' });
    }
});*/

export default router;