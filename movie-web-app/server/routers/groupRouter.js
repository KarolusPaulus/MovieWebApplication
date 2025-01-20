import { pool } from '../helpers/db.js';
import { Router } from 'express';
import { emptyORows } from '../helpers/utils.js';
import { auth } from '../helpers/auth.js';
import { getUserIdByEmail } from '../helpers/userUtils.js';

const groupRouter = Router();

// Fetch all users (for selection)
groupRouter.get('/users',auth, async (req, res) => {
    const userEmail = req.user.email

    try {
        const userResult = await pool.query('SELECT user_id FROM Users WHERE email = $1', [userEmail]);
        if (userResult.rowCount === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const userId = userResult.rows[0].user_id;

        const result = await pool.query(`SELECT user_id, email FROM Users WHERE user_id != $1`, [userId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'An internal error occurred.' });
    }
});

// Get all groups
groupRouter.get('/', (req, res, next) => {
    pool.query('SELECT * FROM Groups', (error, results) => {
        if (error) {
            return next(error);
        }
        res.status(200).json(emptyORows(results));
    });
});

// Add a new group
groupRouter.post('/create', async (req, res) => {
    const { owner_id, name, description } = req.body;

    // Check for missing required fields
    if (!owner_id) {
        console.log('Missing required fields: owner_id');
        return res.status(400).json({ error: 'Missing required fields: owner_id' });
        
    }

    if (!name) {
        console.log('Missing required fields: name');
        return res.status(400).json({ error: 'Missing required fields: name' });
        
    }
    if (!description) {
        console.log('Missing required fields: description');
        return res.status(400).json({ error: 'Missing required fields: description' });
        
    }

    try {
        // Check if group name already exists
        const checkResult = await pool.query('SELECT * FROM Groups WHERE name = $1', [name]);
        if (checkResult.rowCount > 0) {
            console.log('Group name already exists');
            return res.status(400).json({ error: 'Group name already exists' });
        }

        // Create group in the DB
        const result = await pool.query(
            'INSERT INTO Groups (owner_id, name, description) VALUES ($1, $2, $3) RETURNING *',
            [owner_id, name, description]
        );

        // Add the owner to the Group_Members table as an admin
        const groupId = result.rows[0].group_id
        await pool.query(
            'INSERT INTO Group_Members (user_id, group_id, role, status) VALUES ($1, $2, $3, $4)',
            [owner_id, groupId, 'admin', 'accepted']
        )
        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'An internal error occurred.' });
    }
});

// Delete group. Only the group owner can delete the group
groupRouter.delete('/delete/:groupId', auth, async (req, res) => {
    const { groupId } = req.params;
    const userEmail = req.user.email; // Extract user email from the decoded token

    console.log('Starting DELETE /groups/delete/:groupId endpoint');
    console.log('Received groupId:', groupId);
    console.log('Decoded email from token:', userEmail);

    try {
        // First, get the user's ID using their email from the token
        const userResult = await pool.query('SELECT user_id FROM Users WHERE email = $1', [userEmail]);

        if (userResult.rowCount === 0) {

            return res.status(404).json({ message: 'User not found' });
        }

        const userId = userResult.rows[0].user_id;

        // Now, check if the group exists and if the user is the owner
        const groupResult = await pool.query(
            'SELECT * FROM Groups WHERE group_id = $1 AND owner_id = $2',
            [groupId, userId]
        );

        if (groupResult.rowCount === 0) {
            return res.status(403).json({ message: 'You are not authorized to delete this group or group does not exist.' });
        }

        // Delete the group
        const deleteResult = await pool.query(
            'DELETE FROM Groups WHERE group_id = $1 RETURNING *',
            [groupId]
        );

        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ message: 'Group not found.' });
        }

        return res.status(200).json({ message: 'Group deleted successfully.' });
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ message: 'An internal error occurred.' });
    }
});

groupRouter.get('/:groupId', auth, async (req, res, next) => {
    const groupId = req.params.groupId
    const userEmail = req.user.email

    //console.log('User Email:', userEmail)

    try {
        const userResult = await pool.query('SELECT user_id FROM Users WHERE email = $1', [userEmail])
        if (userResult.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' })
        }

        const userId = userResult.rows[0].user_id;

        const membershipCheck = await pool.query(
            'SELECT * FROM Group_Members WHERE group_id = $1 AND user_id = $2 AND status = $3',
            [groupId, userId, 'accepted']
        )

        if (membershipCheck.rowCount === 0) {
            return res.status(403).json({ message: 'You are not a member of this group' })
        }

        const groupResult = await pool.query('SELECT * FROM Groups WHERE group_id = $1', [groupId])
        if (groupResult.rowCount > 0) {
            res.status(200).json(groupResult.rows[0])
        } else {
            res.status(404).json({ message: 'Group not found' })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An internal error occurred.' })
    }
})

// Add users to a group
groupRouter.post('/:groupId/addusers', auth, async (req, res) => {
    const { groupId } = req.params;
    const { userIds } = req.body; // Array of user IDs to be added
    const userEmail = req.user.email;

    if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: 'No user IDs provided.' });
    }

    try {
        const userResult = await pool.query('SELECT user_id FROM Users WHERE email = $1', [userEmail]);
        if (userResult.rowCount === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const userId = userResult.rows[0].user_id;
        const groupResult = await pool.query(
            'SELECT * FROM Groups WHERE group_id = $1 AND owner_id = $2',
            [groupId, userId]
        );

        if (groupResult.rowCount === 0) {
            return res.status(403).json({ error: 'You are not authorized to add users to this group.' });
        }

        const values = userIds.map(userId => `(${groupId}, ${userId}, 'accepted')` ).join(',');
        const insertQuery = `
            INSERT INTO Group_Members (group_id, user_id, status)
            VALUES ${values}
            ON CONFLICT DO NOTHING
        `;

        await pool.query(insertQuery);
        res.status(200).json({ message: 'Users added to group successfully!' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'An internal error occurred.' });
    }
});

// Fetch users in a specific group
groupRouter.get('/:groupId/users', auth, async (req, res) => {
    const { groupId } = req.params;

    try {
        const result = await pool.query(
            `
            SELECT u.user_id, u.email
            FROM GroupMembers gm
            JOIN Users u ON gm.user_id = u.user_id
            WHERE gm.group_id = $1
            `,
            [groupId]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'An internal error occurred.' });
    }
});

groupRouter.post('/addMovie', auth, async (req, res) => {
    const { group_id, imdb_movie_id, added_by } = req.body;

    console.log('Received request for adding movie to group:', {
        group_id: typeof group_id,
        imdb_movie_id: typeof imdb_movie_id,
        added_by: typeof added_by
    });

    try {
        const result = await pool.query(
            'INSERT INTO Group_Movies (group_id, imdb_movie_id, added_by) VALUES ($1, $2, $3) RETURNING *',
            [(group_id), (imdb_movie_id), (added_by)]
        );

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding movie to group:', error);
        res.status(500).json({ error: 'Failed to add movie to group' });
    }
});

groupRouter.get('/favorites/:group_id', auth, async (req, res) => {
    const { group_id } = req.params

    try {
        const result = await pool.query(
            'SELECT imdb_movie_id FROM Group_Movies WHERE group_id = $1', [group_id]
        )
        res.status(200).json({ favorites: result.rows })
    } catch (error) {
        console.error('Error fetching group favorite movies:', error)
        res.status(500).json({ error: 'Failed to fetch favorite movies' })
    }
})

// GET group's showtimes
groupRouter.get('/groupShowtimes/:group_id', auth, async (req, res) => {
    const { group_id } = req.params

    try {
        const result = await pool.query(
            'SELECT * FROM Group_Showings WHERE group_id = $1', [group_id]
        )
        res.status(200).json({ showings: result.rows })
    } catch (error) {
        console.error('Error fetching group showtimes:', error)
        res.status(500).json({ error: 'Failed to fetch group showtimes' })
    }
})

// Share showtimes to group
groupRouter.post('/addShowtime', auth, async (req, res) => {
    const { groupId, title, theatre_name, startTime, additional_info, added_by } = req.body;

    //console.log('Received groupId:', groupId);

    try {
        const parsedAdditionalInfo = additional_info ? JSON.stringify(additional_info) : null;

        const groupShowingsResult = await pool.query(
            'INSERT INTO Group_Showings (group_id, title, theater_name, show_time, additional_info, added_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [groupId, title, theatre_name, startTime, parsedAdditionalInfo, added_by]
        );

        res.status(200).json(groupShowingsResult.rows[0]);
    } catch (error) {
        console.error('Error sharing showtime:', error);
        res.status(500).json({ error: 'Failed to share showtime to group' });
    }
});

groupRouter.delete('/deleteShowtime/:showtimeId', auth, async (req, res) => {
    const { showtimeId } = req.params;
    console.log('Received showtimeId:', showtimeId);  // Debugging line

    if (!showtimeId) {
        return res.status(400).json({ error: 'Showtime ID is required' });
    }

    try {
        const result = await pool.query(
            'DELETE FROM Group_Showings WHERE showing_id = $1 RETURNING *',
            [showtimeId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Showtime not found or already deleted.' });
        }

        res.status(200).json({ message: 'Showtime deleted successfully.' });
    } catch (error) {
        console.error('Error deleting showtime:', error);
        res.status(500).json({ error: 'Failed to delete showtime' });
    }
});


// DELETE movie from group favorites
groupRouter.delete('/:groupId/favorites/:movieId', auth, async (req, res) => {
    console.log('Request Params:', req.params)
    const { groupId, movieId } = req.params
    let userId = req.user?.user_id

    if (!userId) {
        const email = req.user?.email
        if (!email) {
            return res.status(403).json({ error: 'Email not found in token' })
        }

        try {
            userId = await getUserIdByEmail(email)
            if (!userId) {
                return res.status(404).json({ error: 'User not found in the database' })
            }
        } catch (err) {
            return res.status(500).json({ error: 'Failed to retrieve user ID from database' })
        }
    }

    //console.log(`User ID: ${userId}, Group ID: ${groupId}, Movie ID: ${movieId}`)

    try {
        // Check if the user is a member of the group
        const groupMemberQuery = 'SELECT user_id FROM Group_Members WHERE group_id = $1 AND user_id = $2'
        const groupMemberResult = await pool.query(groupMemberQuery, [groupId, userId])

        if (groupMemberResult.rowCount === 0) {
            console.error(`User ID ${userId} is not a member of group ${groupId}`)
            return res.status(403).json({ error: 'User is not a member of the group' })
        }

        const deleteMovieQuery = 'DELETE FROM Group_Movies WHERE group_id = $1 AND imdb_movie_id = $2'
        const deleteMovieResult = await pool.query(deleteMovieQuery, [groupId, movieId])

        if (deleteMovieResult.rowCount === 0) {
            console.error(`Movie ${movieId} not found in group ${groupId} favorites`)
            return res.status(404).json({ error: 'Movie not found in group favorites' })
        }

        console.log(`Movie ${movieId} successfully removed from group ${groupId} favorites`)

        return res.status(200).json({ message: 'Movie removed from group favorites' })
    } catch (err) {
        return res.status(500).json({ error: 'Error during movie deletion' })
    }
})

// Transfer group ownership to another user
groupRouter.post('/:groupId/transferownership', auth, async (req, res) => {
    const { groupId } = req.params
    const { newOwnerId } = req.body
    const userEmail = req.user.email

    try {
        const userResult = await pool.query('SELECT user_id FROM Users WHERE email = $1', [userEmail])
        if (userResult.rowCount === 0) {
            return res.status(404).json({ error: 'User not found.' })
        }

        const currentOwnerId = userResult.rows[0].user_id

        const groupResult = await pool.query('SELECT owner_id FROM Groups WHERE group_id = $1', [groupId])
        if (groupResult.rowCount === 0) {
            return res.status(404).json({ error: 'Group not found.' })
        }

        const currentGroupOwnerId = groupResult.rows[0].owner_id

        if (currentOwnerId !== currentGroupOwnerId) {
            return res.status(403).json({ error: 'You are not the owner of this group.' })
        }

        // Check if the new owner is a member of the group with accepted status
        const memberCheck = await pool.query(
            'SELECT * FROM Group_Members WHERE group_id = $1 AND user_id = $2 AND status = $3',
            [groupId, newOwnerId, 'accepted']
        )

        if (memberCheck.rowCount === 0) {
            return res.status(400).json({ error: 'The new owner must be an accepted member of the group.' })
        }
        await pool.query('BEGIN')

        // Update the owner of the group
        const updateOwnerResult = await pool.query(
            'UPDATE Groups SET owner_id = $1 WHERE group_id = $2 RETURNING *',
            [newOwnerId, groupId]
        )

        if (updateOwnerResult.rowCount === 0) {
            await pool.query('ROLLBACK');
            return res.status(500).json({ error: 'Failed to transfer group ownership.' })
        }

        // Update the roles of the users (current owner becomes member, new owner becomes admin)
        await pool.query(
            'UPDATE Group_Members SET role = $1 WHERE user_id = $2 AND group_id = $3',
            ['admin', newOwnerId, groupId]
        )

        await pool.query(
            'UPDATE Group_Members SET role = $1 WHERE user_id = $2 AND group_id = $3',
            ['member', currentOwnerId, groupId]
        )
        await pool.query('COMMIT')

        res.status(200).json({ message: 'Ownership successfully transferred to the new owner.' })
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error transferring ownership:', error)
        res.status(500).json({ error: 'An internal error occurred while transferring ownership.' })
    }
})

export default groupRouter;