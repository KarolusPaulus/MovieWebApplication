import jwt from "jsonwebtoken";
import { isTokenBlacklisted } from "../helpers/blacklist.js";

const authorizationRequired = "Authorization required";
const invalidCredentials = "Invalid credentials";

const auth = (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).json({ message: authorizationRequired });
    }

    const tokenParts = req.headers.authorization.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Invalid Authorization format. Expected Bearer <token>' });
    }

    const token = tokenParts[1];

    // Check if the token is blacklisted
    if (isTokenBlacklisted(token)) {
        return res.status(403).json({ message: 'Token has been invalidated. Please login again.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded; // Attach decoded token to request
        req.user = { email: decoded.user };
        //console.log('Decoded token:', decoded)

        next();
    } catch (err) {
        return res.status(403).json({ message: invalidCredentials });
    }
};

export { auth };