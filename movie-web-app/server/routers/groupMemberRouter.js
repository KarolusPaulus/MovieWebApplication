import { auth } from '../helpers/auth.js';
import { pool } from '../helpers/db.js';
import { Router } from 'express';
import { emptyORows } from '../helpers/utils.js';


const groupMemberRouter = Router();

// Get all group members
groupMemberRouter.get('/', (req, res, next) => {
    pool.query('SELECT * FROM Group_Members', (error, results) => {
        if (error) {
            return next(error);
        }
        res.status(200).json(emptyORows(results));
    });
});

// Get groups where the user is a member and status is 'accepted'
groupMemberRouter.get('/user/:user_id', (req, res, next) => {
    const userId = req.params.user_id;
    console.log('Fetching memberships for user:', userId);

    const query = `
        SELECT gm.group_id, g.name, g.owner_id, g.description
        FROM Group_Members gm
        INNER JOIN Groups g ON gm.group_id = g.group_id
        WHERE gm.user_id = $1 AND gm.status = $2
    `;
    const params = [userId, 'accepted'];

    pool.query(query, params, (error, results) => {
        if (error) {
            console.error('Error executing query:', error);
            return next(error);
        }
        console.log('Query results:', results.rows); // Log what is being returned
        res.status(200).json(results.rows);
    });
});

// Add a new member to a group

groupMemberRouter.post('/add', async (req, res) => {
    const { user_id, group_id } = req.body;

    try {
        // Check if the user is already a member of the group
        const existingMembership = await pool.query(
            `SELECT * FROM Group_Members WHERE user_id = $1 AND group_id = $2`,
            [user_id, group_id]
        )

        if (existingMembership.rowCount > 0) {
            const currentStatus = existingMembership.rows[0].status

            if (currentStatus === 'accepted' || currentStatus === 'pending') {
                return res.status(400).json({ error: 'User is already a member or request is pending.' })
            }

            if (currentStatus === 'rejected') {
                // Update status back to 'pending' if previously rejected
                const updatedRequest = await pool.query(
                    `UPDATE Group_Members SET status = $1 WHERE user_id = $2 AND group_id = $3 RETURNING *`,
                    ['pending', user_id, group_id]
                )
                return res.status(200).json(updatedRequest.rows[0])
            }
            //return res.status(400).json({ error: 'User is already a member of the group.' })
        }

        // Add the user to the group if checks pass
        const result = await pool.query(
            `INSERT INTO Group_Members (user_id, group_id)
            VALUES ($1, $2)
            RETURNING *`,
            [user_id, group_id]
        )

        res.status(200).json(result.rows[0])
    } catch (error) {
        res.status(500).json(error)
    }
});

groupMemberRouter.get('/users', async (req, res, next) => {
    try {
        const result = await pool.query('SELECT user_id, email FROM Users');
        res.status(200).json(result.rows);
    } catch (error) {
        next(error);
    }
});

groupMemberRouter.post('/owner/add', auth, async (req, res) => {
    const { user_id, group_id } = req.body
    const userEmail = req.user.email

    try {
        // Verify the requester is the group owner
        const ownerResult = await pool.query(
            `SELECT owner_id FROM Groups WHERE group_id = $1`,
            [group_id]
        )

        if (ownerResult.rowCount === 0) {
            return res.status(404).json({ error: 'Group not found.' })
        }

        const owner_id = ownerResult.rows[0].owner_id

        const requesting_user = await pool.query(
            `SELECT user_id FROM Users WHERE email = $1`,
            [userEmail]
        )

        if (requesting_user.rows[0].user_id !== owner_id) {
            return res.status(403).json({ error: 'Only the group owner can add members directly.' })
        }

        // Check if the user is already a member
        const existingMembership = await pool.query(
            `SELECT * FROM Group_Members WHERE user_id = $1 AND group_id = $2`,
            [user_id, group_id]
        )

        if (existingMembership.rowCount > 0) {
            const currentStatus = existingMembership.rows[0].status

            if (currentStatus === 'accepted') {
                return res.status(400).json({ error: 'User is already a member.' })
            }
            if (currentStatus === 'pending' || currentStatus === 'rejected') {
                await pool.query(
                    `UPDATE Group_Members SET status = $1 WHERE user_id = $2 AND group_id = $3`,
                    ['accepted', user_id, group_id]
                )
                return res.status(200).json({ message: 'User added successfully.' })
            }
        }

        // Directly add the user with 'accepted' status
        const result = await pool.query(
            `INSERT INTO Group_Members (user_id, group_id, status)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [user_id, group_id, 'accepted']
        )

        res.status(200).json(result.rows[0])
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Remove a member from a group. Only the group owner can remove members. All members can remove themselves from a group

groupMemberRouter.delete('/remove', auth, async (req, res) => {
    const { user_id, group_id } = req.body;
    const userEmail = req.user.email; // Extract user email from the decoded token

    console.log('Starting DELETE /groupmembers/remove endpoint');
    console.log('Received groupId:', group_id);
    console.log('Received userId to remove:', user_id);
    console.log('Decoded email from token:', userEmail);

    try {
        // Step 1: Get the requesting user's ID using their email
        const userResult = await pool.query('SELECT user_id FROM Users WHERE email = $1', [userEmail]);

        if (userResult.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const requesting_user_id = userResult.rows[0].user_id;

        // Step 2: Check if the group exists and get the owner ID
        const groupResult = await pool.query(
            'SELECT owner_id FROM Groups WHERE group_id = $1',
            [group_id]
        );

        if (groupResult.rows.length === 0) {
            return res.status(404).json({ error: 'Group not found.' });
        }

        const owner_id = groupResult.rows[0].owner_id;

        // Step 3: Authorization checks
        if (requesting_user_id === owner_id) {
            // Owner can remove any user
        } else if (requesting_user_id === user_id) {
            // User can remove themselves
        } else {
            return res.status(403).json({ error: 'You are not authorized to remove this user.' });
        }

        // Step 4: Perform the deletion
        const deleteResult = await pool.query(
            'DELETE FROM Group_Members WHERE user_id = $1 AND group_id = $2 RETURNING *',
            [user_id, group_id]
        );

        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ error: 'No such user in the group.' });
        }

        res.status(200).json({ message: 'User removed from the group.', removedMember: deleteResult.rows[0] });
    } catch (error) {
        console.error('Error in DELETE /groupmembers/remove:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get pending join requests for a specific group (only for group owner)
groupMemberRouter.get('/requests/:group_id', (req, res, next) => {
    const { group_id } = req.params

    pool.query(
        // Select all group members with the given group_id and 'pending' status
        `SELECT gm.user_id, u.email, gm.status
        FROM Group_Members gm JOIN Users u
        ON gm.user_id = u.user_id 
        WHERE gm.group_id = $1
        AND gm.status = $2`,
        [group_id, 'pending'],
        (error, results) => {
            if (error) {
                return next(error)
            }
            res.status(200).json(results.rows)
        }
    )
})

// Accept a join request
groupMemberRouter.post('/accept', (req, res) => {
    const { user_id, group_id } = req.body

    pool.query(
        // Update the status of a specific group member to 'accepted'
        'UPDATE Group_Members SET status = $1 WHERE user_id = $2 AND group_id = $3 RETURNING *',
        ['accepted', user_id, group_id],
        (error, result) => {
            if (error) {
                return res.status(500).json({ error: error.message })
            }
            res.status(200).json(result.rows[0])
        }
    )
})

// Reject a join request
groupMemberRouter.post('/reject', (req, res) => {
    const { user_id, group_id } = req.body

    pool.query(
        // Update the status of a specific group member to 'rejected'
        'UPDATE Group_Members SET status = $1 WHERE user_id = $2 AND group_id = $3 RETURNING *',
        ['rejected', user_id, group_id],
        (error, result) => {
            if (error) {
                return res.status(500).json({ error: error.message })
            }
            res.status(200).json(result.rows[0])
        }
    )
})

// Fetch users who are not members of the group
groupMemberRouter.get('/nonmembers/:group_id', async (req, res, next) => {
    const { group_id } = req.params;

    try {
        const ownerResult = await pool.query(
            `SELECT owner_id FROM Groups WHERE group_id = $1`,
            [group_id]
        )

        if (ownerResult.rowCount === 0) {
            return res.status(404).json({ error: 'Group not found' })
        }

        const owner_id = ownerResult.rows[0].owner_id

        const result = await pool.query(
            `SELECT user_id, email
            FROM Users
            WHERE user_id != $2 AND user_id NOT IN (
            SELECT user_id 
            FROM Group_Members
            WHERE group_id = $1 AND (status = 'accepted' OR status = 'pending'))`,
            [group_id, owner_id]
        )

        res.status(200).json(result.rows)
    } catch (error) {
        next(error)
    }
})

// Fetch all members of a group except the owner
groupMemberRouter.get('/members/:group_id', async (req, res, next) => {
    const { group_id } = req.params
    
    try {
        const ownerResult = await pool.query(
            `SELECT owner_id FROM Groups WHERE group_id = $1`,
            [group_id]
        )

        if (ownerResult.rowCount === 0) {
            return res.status(404).json({ error: 'Group not found' })
        }

        const owner_id = ownerResult.rows[0].owner_id

        const membersResult = await pool.query(
            `SELECT gm.user_id, u.email, gm.status
            FROM Group_Members gm
            JOIN Users u ON gm.user_id = u.user_id
            WHERE gm.group_id = $1 AND gm.status = 'accepted' AND gm.user_id != $2`,
            [group_id, owner_id]
        )

        res.status(200).json(membersResult.rows)
    } catch (error) {
        next(error)
    }
})

// Allow a user to leave a group
groupMemberRouter.post('/leave', auth, async (req, res) => {
    const { group_id } = req.body
    const userEmail = req.user.email

    try {
        // Get the user's ID using their email
        const userResult = await pool.query('SELECT user_id FROM Users WHERE email = $1', [userEmail])

        if (userResult.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' })
        }

        const user_id = userResult.rows[0].user_id

        // Check if the user is a member of the group
        const membershipResult = await pool.query(
            'SELECT * FROM Group_Members WHERE user_id = $1 AND group_id = $2',
            [user_id, group_id]
        )

        if (membershipResult.rowCount === 0) {
            return res.status(404).json({ error: 'You are not a member of this group.' })
        }

        // Remove the user from the group
        const deleteResult = await pool.query(
            'DELETE FROM Group_Members WHERE user_id = $1 AND group_id = $2 RETURNING *',
            [user_id, group_id]
        )

        if (deleteResult.rowCount === 0) {
            return res.status(500).json({ error: 'Unable to leave the group.' })
        }

        res.status(200).json({ message: 'You have successfully left the group.' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default groupMemberRouter;