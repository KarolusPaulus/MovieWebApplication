import { pool } from "./db.js";

const getUserIdByEmail = async (email) => {
    try {
        //console.log('Fetching user_id for email:', email)
        const result = await pool.query("SELECT user_id FROM Users WHERE email = $1", [email])
        if (result.rowCount === 0) {
            return null
        }
        return result.rows[0].user_id
    } catch (err) {
        throw err
    }
}

export { getUserIdByEmail }