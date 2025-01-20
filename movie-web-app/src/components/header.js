import React, { useState } from 'react';
import SearchBar from './search';
import logo from '../assets/logo.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/useUser';
import DeleteAccount from './deleteAccount';

const Header = ({ setQuery, setSelectedGenre, setSelectedYear, setSelectedAgeRating }) => {
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { user, signOut } = useUser()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = () => {
    signOut()
    navigate('/')
  }

  const toggleAccDropdown = () => {
    setDropdownOpen(prevState => !prevState)
  }

  const toggleMobileDropdown = () => {
    setMobileDropdownOpen((prevState) => !prevState)
  }

  const handleLogoClick = () => {
    if (location.pathname === '/') {
      window.location.reload()
    } else {
      navigate('/')
    }
  }

  return (
    <div className="header-container">
      <div class="header-content">
      <div className="logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="Logo" />
        </div>

          <div class="search-outer-container">
            <button class="mobile-menu-toggle" onClick={toggleMobileDropdown}>
              <i class="fa-solid fa-bars"></i>
            </button>
      
      <SearchBar
        setQuery={setQuery}
        setSelectedGenre={setSelectedGenre}
        setSelectedYear={setSelectedYear}
        setSelectedAgeRating={setSelectedAgeRating}
      />

      <div class="header-button-container">
          {user && user.token && (
            <Link class="header-links" to="/allgroups">GROUPS</Link>
          )}
          <Link class="header-links" to="/showtimes">SHOWTIMES</Link>

          {user && user.token ? (
            <>
              <div class="account-menu-container" onClick={toggleAccDropdown}>
                <div class="account-icon-container">
                  <i class="fa-solid fa-circle-user"></i>
                </div>
                {dropdownOpen && (
                  <div class="account-dropdown-menu">
                    <Link class="account-dropdown-item" to="/userprofile">MY PROFILE</Link>
                    <div class="account-dropdown-item" onClick={handleSignOut}>SIGN OUT</div>
                    <DeleteAccount />
                  </div>)}
              </div>
            </>
          ) : (
            <Link class="header-links" to="/signin">SIGN IN</Link>
          )}
        </div>
    </div>
    
      {mobileDropdownOpen && (
          <div class="mobile-menu open">
            {user && user.token && (
              <Link class="account-dropdown-item" to="/allgroups">GROUPS</Link>
            )}
            <Link class="account-dropdown-item" to="/showtimes">SHOWTIMES</Link>

            {user && user.token ? (
              <>
                <Link class="account-dropdown-item" to="/userprofile">MY PROFILE</Link>
                <div class="account-dropdown-item" onClick={handleSignOut}>SIGN OUT</div>
                <DeleteAccount/>
              </>
              ) : (
                <Link class="account-dropdown-item" to="/signin">SIGN IN</Link>
          )}
      </div>
    )}
    </div>
  </div>
  )
}

export default Header
