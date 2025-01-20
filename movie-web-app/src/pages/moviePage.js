import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '../context/useUser';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Header from '../components/header';
import { motion } from 'framer-motion';

const url = process.env.REACT_APP_BACKEND_CONNECTION
const MyKey = process.env.REACT_APP_API_KEY

export default function MoviePage() {
  const { user } = useUser()
  const { movieId } = useParams()
  const [movieDetails, setMovieDetails] = useState(null)
  const [tmdbReviews, setTmdbReviews] = useState([])
  const [localReviews, setLocalReviews] = useState([])
  const [newReview, setNewReview] = useState({ content: '', rating: '' })
  const [isFavorite, setIsFavorite] = useState(false)
  const [userGroups, setUserGroups] = useState([]);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  
  // Check if the movie is in the user's favorites
  useEffect(() => {
    if (user.token) {
      axios.get(url + '/favorites', {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      .then(res => {
        setIsFavorite(res.data.favorites.includes(movieId))
      })
      .catch(err => console.error('Error fetching favorites:', err))
    }
  }, [movieId, user.token])

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${MyKey}&language=en-US`)
      .then(res => res.json())
      .then(json => {
        setMovieDetails(json)
      })
      .catch(err => console.error(err))
  }, [movieId])

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/movie/${movieId}/reviews?api_key=${MyKey}&language=en-US&page=1`)
    .then(res => res.json())
    .then(json => {
      setTmdbReviews(json.results)
    })
    .catch(err => console.error(err))
  }, [movieId])

  useEffect(() => {
    fetch(url + `/reviews/${movieId}`)
      .then(res => res.json())
      .then(json => {
        setLocalReviews(json.reviews.map(review => ({
          ...review,
          createdAt: new Date(review.createdAt).toLocaleString()
        })))
      })
      .catch(err => console.error(err))
  }, [movieId])

  // Add useEffect to fetch user's groups
  useEffect(() => {
    if (user.token) {
        // Fetch groups user is a member of
        const getMemberGroups = fetch(url + `/groupMembers/user/${user.user_id}`)
            .then(response => response.json())
            .then(data => {
                console.log('Member groups:', data);
                return data;
            });
        
        // Fetch groups where user is owner
        const getOwnedGroups = fetch(url + `/groups`)
            .then(response => response.json())
            .then(data => {
                console.log('All groups:', data);
                // Filter groups where user is owner
                return data.filter(group => group.owner_id === user.user_id);
            });

        // Combine both results
        Promise.all([getMemberGroups, getOwnedGroups])
            .then(([memberGroups, ownedGroups]) => {
                console.log('Combined groups:', { memberGroups, ownedGroups });
                const allGroups = [...memberGroups, ...ownedGroups];
                // Remove duplicates based on group_id
                const uniqueGroups = [...new Map(allGroups.map(group => 
                    [group.group_id, group])).values()];
                setUserGroups(uniqueGroups);
            });
    }
}, [user]);

// Add movie to Group handler
const addMovieToGroup = async (groupId) => {
  try {
    console.log('Attempting to add movie:', {
      groupId,
      movieId,
      userId: user.user_id,
      token: !!user.token // Log if token exists
  });
      const response = await fetch(url + '/groups/addMovie', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({
            group_id: parseInt(groupId),
            imdb_movie_id: (movieId), 
            added_by: parseInt(user.user_id)
          })
      });

      if (!response.ok) {
          throw new Error('Failed to add movie to group');
      }

      const data = await response.json();
      alert('Movie added to group successfully!');
      setShowGroupDropdown(false);
  } catch (error) {
      console.error('Error adding movie to group:', error);
      alert('Failed to add movie to group');
  }
};

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      review_text: newReview.content,
      imdb_movie_id: movieId,
      rating: newReview.rating,
    }

    try {
      const headers = {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      }
      await axios.post(url + `/reviews/${movieId}`, payload, headers)

      // Fetch updated reviews after posting
      fetch(url + `/reviews/${movieId}`)
        .then(res => res.json())
        .then(json => setLocalReviews(json.reviews))
        .catch(err => console.error(err))

      // Clear the form
      setNewReview({ content: '', rating: '' })
    } catch (err) {
      console.error('Error posting review:', err)
    }
  }

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
          await axios.delete(url + `/favorites/${movieId}`, {
            headers: { Authorization: `Bearer ${user.token}` }
        })
        setIsFavorite(false)
      } else {
          await axios.post(url + `/favorites/${movieId}`, {}, {
            headers: { Authorization: `Bearer ${user.token}` }
        })
        setIsFavorite(true)
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    try {
        await axios.delete(url + `/reviews/${reviewId}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
      })

      // Update local reviews after deleting
      setLocalReviews(prev => prev.filter(review => review.id !== reviewId))
    } catch (err) {
      console.error('Error deleting review:', err)
    }
  }

  
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
        <div class="movie-detail-container">
      {movieDetails && (
        <>
          <img class="movie-poster"
          src={`https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`}
          alt={movieDetails.title}
      />
      <div>
        <h1 class="default-big-title-white">{movieDetails.title}</h1>
        <p class="default-text">{movieDetails.genres.map(genre => genre.name).join(', ')}</p>
        <p class="default-text"><strong>Rating:</strong>
        <span class="movie-rating">
          <i class="fa fa-star"></i> {movieDetails.vote_average}
          </span></p>
        <p class="default-text">{movieDetails.overview}</p>
        <p class="default-text">{movieDetails.release_date}</p>
        <div onClick={toggleFavorite} className={user.token ? '' : 'disabled'}>
            <i className={`fa-heart favorite-heart
              ${isFavorite ? 'fa-solid active' : 'fa-regular outline'}`}></i>
                <span class="default-text">
                  {isFavorite ? ' Remove from Favorites' : ' Add to Favorites'}
                </span>
        </div>
         
<div className="add-to-group">
    <div onClick={() => setShowGroupDropdown(!showGroupDropdown)}>
        <i className="fas fa-users"></i>
        <span class="default-text"> Add to Group</span>
    </div>
    {showGroupDropdown && user.token && (
        <div className="group-dropdown">
            {userGroups.map(group => (
                <div 
                    key={group.group_id} 
                    className="group-option"
                    onClick={() => addMovieToGroup(group.group_id)}
                >
                    {group.name}
                </div>
            ))}
        </div>
    )}
</div>
      </div>
      </>
      )}
      </div>

      {user.token ? (
        <div class="post-review">
          <div class="post-review-title">
            <h2 class="default-medium-title">Write a review</h2>
            <div class="review-stars">
              {[1, 2, 3, 4, 5].map((num) => (
                <i
              key={num}
              class={`fa fa-star ${num <= newReview.rating ? 'active' : ''}`}
              onClick={() => setNewReview({ ...newReview, rating: num })}
            ></i>
        ))}
      </div>
    </div>
    <form onSubmit={handleReviewSubmit}>
      <div class="review-box-container">
        <div>
          <i class="fa fa-user-circle" style={{ fontSize: '2rem', color: '#fff' }}></i>
        </div>
        <textarea
          class="review-box"
          value={newReview.content}
          onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
          placeholder="Write your review..."
          required
        ></textarea>
      </div>
      <div class="post-review-button-container">
        <button class="default-button-pink" type="submit">Post</button>
      </div>
    </form>
  </div>
      ) : (
        <div class="default-text-center">
          <p>You need to be logged in to post a review.
            <Link class="link" to="/signin" style={{ marginLeft: '8px' }}>Sign In</Link>
          </p>
        </div>
      )}
      
    <div class="review-container">
      <h2 class="default-medium-title">Reviews</h2>
        {localReviews.length > 0 && (
          localReviews.map(review => (
            <div key={review.id} class="review">
              <div class="review-header">
                <strong>{review.author}</strong>
                <span>{review.rating && `${review.rating} ⭐`}</span>
            </div>
            <p class="default-text">{review.content}</p>
            <span class="review-date">{review.createdAt}</span>
            {review.author === user.email && (
              <div class="delete-button-container">
                <button class="delete-button"
                onClick={() => handleDeleteReview(review.id)}>Delete
                </button>
            </div>
          )}
          </div>
          ))
        )}
        {tmdbReviews.length > 0 && (
          tmdbReviews.map(review => (
            <div key={review.id} class="review">
              <div class="review-header">
                <strong>{review.author}</strong>
                <span>⭐</span>
              </div><p class="default-text">{review.content}</p>
            </div>
          ))
        )}
      </div>
    </motion.div>
    )
  }