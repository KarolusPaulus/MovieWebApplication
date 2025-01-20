import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const url = process.env.REACT_APP_BACKEND_CONNECTION
const MyKey = process.env.REACT_APP_API_KEY

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([])
  const { email } = useParams()

  useEffect(() => {
    if (email) {
      fetch(`${url}/favorites/${email}`, {
        method: 'GET',
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to fetch favorites')
          }
          return response.json()
        })
        .then((data) => {
          const favoriteMovieIds = data.favorites
          const moviePromises = favoriteMovieIds.map((id) =>
            fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${MyKey}&language=en-US`)
              .then((res) => res.json())
          )
          Promise.all(moviePromises).then(setFavorites)
        })
        .catch((err) => console.error(err))
    }
  }, [email])

  
  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
};

const pageTransition = {
    duration: 0.5,
    ease: 'easeOut'
};

return (
    <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
    >
    <div>
      <h1 class="center-item">Favorites</h1>
      <div className="movie-container">
        {favorites.length > 0 ? (
          favorites.map((movie) => (
            <div className="movie-card" key={movie.id}>
              <img className="poster-image" src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} alt={movie.title} />
            </div>
          ))
        ) : (
          <p>No favorites found.</p>
        )}
      </div>
    </div>
    </motion.div>
  )
}
