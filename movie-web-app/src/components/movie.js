import React, { useEffect, useState } from 'react'
import '../stylesheet.css'
import { Link } from 'react-router-dom';

const MyKey = process.env.REACT_APP_API_KEY

function Movie({ movies }) {
  const [movieList, setMovieList] = useState([]);

  const getMovies = () => {
    fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${MyKey}&language=en-US&page=1`)
      .then(res => res.json())
      .then(json => {
        setMovieList(json.results)
      })
      .catch(err => console.error(err))
  }

  useEffect(() => {
    if (movies.length === 0) {
      getMovies()
    } else {
        setMovieList(movies)
      }
  }, [movies])

  return (
    <div class="movie-container">{
      movieList.map((movie) => (
        <div class="movie-card" key={movie.id}>
          <Link to={`/moviepage/${movie.id}`}> 
          <img class="poster-image" src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} />
          </Link>
        </div>
      ))}
    </div>
  )
}

export default Movie