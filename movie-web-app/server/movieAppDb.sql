-- Drop existing tables
DROP TABLE IF EXISTS Group_Movies;
DROP TABLE IF EXISTS Group_Showings;
DROP TABLE IF EXISTS Showings;
DROP TABLE IF EXISTS Reviews;
DROP TABLE IF EXISTS Favorites;
DROP TABLE IF EXISTS Group_Members;
DROP TABLE IF EXISTS Groups;
DROP TABLE IF EXISTS Users;

-- Users Table
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

-- Groups Table
CREATE TABLE Groups (
    group_id SERIAL PRIMARY KEY,
    owner_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL
    
);

-- Group_Members Table (Composite Primary Key)
CREATE TABLE Group_Members (
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    group_id INT REFERENCES Groups(group_id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('member', 'admin')) DEFAULT 'member',
    status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    PRIMARY KEY (user_id, group_id)
);

-- Favorites Table (Composite Primary Key)
CREATE TABLE Favorites (
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    -- imdb_movie_id VARCHAR(20) NOT NULL, -- IMDb movie ID reference
    imdb_movie_id INT NOT NULL,
    PRIMARY KEY (user_id, imdb_movie_id)
);

-- Reviews Table (Single Primary Key with Unique Constraint)
CREATE TABLE Reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    -- imdb_movie_id VARCHAR(20) NOT NULL, -- IMDb movie ID reference
    imdb_movie_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Track creation time
    UNIQUE (user_id, imdb_movie_id) -- Ensures one review per movie per user
);

-- Group_Showings Table
CREATE TABLE Group_Showings (
    showing_id SERIAL PRIMARY KEY, -- Unique identifier for each showtime
    group_id INT REFERENCES Groups(group_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL, -- Movie title
    theater_name VARCHAR(255) NOT NULL, -- Theater location
    show_time TIMESTAMP NOT NULL, -- Show start time (combined date and time)
    additional_info JSONB, -- Optional field for details like language, subtitles, etc.
    added_by INT REFERENCES Users(user_id) ON DELETE SET NULL, -- Tracks who shared the showtime
);

-- Group_Movies Table (Store movies associated with groups)
CREATE TABLE Group_Movies (
    group_id INT REFERENCES Groups(group_id) ON DELETE CASCADE,
    --- imdb_movie_id VARCHAR(20) NOT NULL,
    imdb_movie_id INT NOT NULL,
    added_by INT REFERENCES Users(user_id) ON DELETE SET NULL,
    PRIMARY KEY (group_id, imdb_movie_id)
);
