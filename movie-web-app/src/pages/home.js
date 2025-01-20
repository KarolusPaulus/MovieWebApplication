import React, { useState, useEffect } from 'react';
import Header from '../components/header';
import Movie from '../components/movie';
import { motion } from 'framer-motion';

export function Home() {
  const [results, setResults] = useState([])
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState(null)
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedAgeRating, setSelectedAgeRating] = useState(null)

  const MyKey = process.env.REACT_APP_API_KEY
  const BASE_URL = 'https://api.themoviedb.org/3'

  const fetchMovies = () => {
    let url = `${BASE_URL}/discover/movie?api_key=${MyKey}&language=en-US&page=${page}`

    if (query) {
      url = `${BASE_URL}/search/movie?api_key=${MyKey}&query=${query}&page=${page}&include_adult=false`
    }
    if (selectedGenre) {
      url += `&with_genres=${selectedGenre}`
    }
    if (selectedYear) {
      url += `&primary_release_year=${selectedYear}`
    }
    if (selectedAgeRating) {
      url += `&certification_country=US&certification=${selectedAgeRating}`
    }

    fetch(url)
      .then((res) => res.json())
      .then((json) => setResults(json.results || []))
      .catch((err) => console.error(err))
  }

  useEffect(() => {
    fetchMovies()
  }, [page, query, selectedGenre, selectedYear, selectedAgeRating])

  const handleNextPage = () => setPage((prev) => prev + 1)
  const handlePrevPage = () => setPage((prev) => Math.max(prev - 1, 1))

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
      <Header
        setQuery={setQuery}
        setSelectedGenre={setSelectedGenre}
        setSelectedYear={setSelectedYear}
        setSelectedAgeRating={setSelectedAgeRating}
      />
      <div class="center-item">
        <Movie movies={results}/>
      </div>
      <div className="pagination-controls">
        <button class="control-button" onClick={handlePrevPage} disabled={page === 1}>
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <span>Page {page}</span>
        <button class="control-button" onClick={handleNextPage}>
          <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </motion.div>
  )
}
