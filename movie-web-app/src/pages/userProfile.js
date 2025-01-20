import React, { useEffect, useState } from 'react';
import Header from '../components/header';
import { useUser} from '../context/useUser';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { faArrowUpFromBracket } from '@fortawesome/free-solid-svg-icons'; 

const url = process.env.REACT_APP_BACKEND_CONNECTION
const MyKey = process.env.REACT_APP_API_KEY

export default function MyProfile() {
    const [email, setEmail] = useState(null);
    const { user } = useUser()
    const [favorites, setFavorites] = useState([])
    const [shareUrl, setShareUrl] = useState('')

    useEffect(() => {
        console.log("User token:", user.token); // Check the token in the console
        if (user.token) {
            fetch(url + '/user/email', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                },
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('failed to fetch email');
                    }
                    return response.json();
                })
                .then((data) => {
                    setEmail(data.email)
                setShareUrl(`${window.location.origin}/favorites/${data.email}`);
                })
                .catch((err) => console.error(err));
        }
    }, [user]);

    // Fetch user's favorites
    useEffect(() => {
        if (user.token) {
            fetch(`${url}/favorites`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${user.token}` },
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
        .catch((err) => console.error('Error fetching favorites:', err))
    }
  }, [user.token])


  const handleDelete = (movieId) => {
    if (window.confirm('Are you sure you want to remove this movie from your favorites?')) {
      fetch(url + `/favorites/${movieId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to remove movie from favorites')
          }
          setFavorites(favorites.filter((movie) => movie.id !== movieId))
          alert('Movie removed from favorites!')
        })
        .catch((err) => {
          console.error('Error deleting movie:', err);
        })
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Link copied to clipboard!');
    });
};
    
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
            <Header/>
            <div class="center-item">
            <h1 class="default-big-title-white">My Profile</h1>
            <div>            
            <h2 class="default-medium-title">My Information</h2>
            <p class="default-text">{email || 'Fetching email...'}</p>
            </div>
            <div>
            <h2 class="default-medium-title">My Favorites</h2>
            <div class="movie-container">
                {favorites.length > 0 ? (
                    favorites.map((movie) => (
                        <div class="movie-card-pf" key={movie.id}>
                            <button onClick={() => handleDelete(movie.id)} className="x-mark" title="Remove from favorites">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                            <Link to={`/moviepage/${movie.id}`}>
                            <img class="poster-image"
                                src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                                alt={movie.title}
                            /></Link>
                        </div>
                    ))
            ) : (
                <p class="default-text">No favorites? Tough audience.</p>
                )}
            </div>
            </div>

            <div className="share-icon-container default-form-group " onClick={copyToClipboard} title="Copy to Clipboard">
                <p class="default-text">Share your favorites</p>
                <i class="fa-solid fa-share"></i></div>
            </div>
       </motion.div>
    );
}
