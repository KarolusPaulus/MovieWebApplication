import express from 'express'
import cors from 'cors'
import movieAppDb from './routers/movieAppDb.js'
import userRouter from './routers/userRouter.js'
import groupRouter from './routers/groupRouter.js'
import groupMemberRouter from './routers/groupMemberRouter.js'
import reviewRouter from './routers/reviewRouter.js'
import favoritesRouter from './routers/favoritesRouter.js'
//import { pool } from './helpers/db.js'
//import { response } from 'express'

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/', movieAppDb); // Database router
app.use('/user', userRouter); // User router
app.use('/groups', groupRouter); // Group router
app.use('/groupMembers', groupMemberRouter); // Group member router
app.use('/reviews', reviewRouter); // Movie review router
app.use('/favorites', favoritesRouter); // Favorites router

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500
  res.status(statusCode).json({error: err.message}) 
})

app.listen(port)
