import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useUser } from '../context/useUser';
import Header from '../components/header';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const url = process.env.REACT_APP_BACKEND_CONNECTION
const MyKey = process.env.REACT_APP_API_KEY

export function GroupPage() {
    const { user } = useUser()
    const { groupId } = useParams()
    const [group, setGroup] = useState(null)
    const [pendingRequests, setPendingRequests] = useState([])
    const [nonMembers, setNonMembers] = useState([])
    const [members, setMembers] = useState([])
    const [showAddMembers, setShowAddMembers] = useState(false)
    const [showRemoveMembers, setShowRemoveMembers] = useState(false)
    const [favorites, setFavorites] = useState([])
    const navigate = useNavigate()
    const [showTransferOwnership, setShowTransferOwnership] = useState(false)
    const [groupShowtimes, setGroupShowtimes] = useState([]);

    useEffect(() => {
        // Fetch group info by group id
        fetch(url + `/groups/${groupId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        })
        .then((response) => {
            if (response.status === 403) {
                // If user is not a member, redirect to the unauthorized page
                navigate('/unauthorized', { replace: true })
            } else {
                return response.json()
            }
        })
            .then(json => {
                console.log(json)
                setGroup(json)
            })
            .catch(err => console.error(err))
            
            // Fetch pending join requests
            if (user.user_id) {
                fetch(url + `/groupMembers/requests/${groupId}`)
                .then(response => response.json())
                .then(data => setPendingRequests(data))
                .catch(err => console.error(err))

            // Fetch users who are not members and not the owner
            fetch(url + `/groupMembers/nonmembers/${groupId}`)
                .then(response => response.json())
                .then(data => setNonMembers(data))
                .catch(err => console.error(err))
            }
    }, [groupId, user.user_id, navigate])

    useEffect(() => {
        // Fetch favorite movies for the group
        fetch(url + `/groups/favorites/${groupId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        })
        .then((response) => response.json())
        .then((data) => {
            if (Array.isArray(data.favorites)) {
                //console.log(data.favorites)
                const favoriteMovieIds = data.favorites.map(item => item.imdb_movie_id)
                const moviePromises = favoriteMovieIds.map((id) =>
                    fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${MyKey}&language=en-US`)
                    .then((res) => res.json())
                )
                Promise.all(moviePromises).then(setFavorites)
            } else {
                console.error("Favorites data is not in the expected format:", data.favorites)
                setFavorites([])
            }
        })
        .catch((err) => console.error('Error fetching favorites:', err))
    }, [groupId])

    useEffect(() => {
        // Fetch showtimes for the group
        fetch(url + `/groups/groupShowtimes/${groupId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        })
        .then((response) => response.json())
        .then((data) => {
            console.log('Fetched showtimes:', data);
            setGroupShowtimes(data.showings);
        })        
        .catch(err => console.error('Error fetching showtimes:', err))
    }, [groupId, user.token])    
    
    const handleAcceptRequest = (user_id) => {
        fetch(url + `/groupMembers/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id, group_id: groupId })
        })
            .then(response => response.json())
            .then(data => {
                alert('User accepted')
                setPendingRequests(prev => prev.filter(req => req.user_id !== user_id))
            })
            .catch(err => console.error(err))
    }

    const handleRejectRequest = (user_id) => {
        fetch(url + `/groupMembers/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id, group_id: groupId })
        })
            .then(response => response.json())
            .then(data => {
                alert('User rejected')
                setPendingRequests(prev => prev.filter(req => req.user_id !== user_id))
            })
            .catch(err => console.error(err))
    }

    const handleShowNonMembers = () => {
        fetch(url + `/groupMembers/nonmembers/${groupId}`)
            .then(response => response.json())
            .then(data => {
                console.log('Non-members (including rejected):', data);
                setNonMembers(data);
            })
            .catch(err => console.error(err))
        setShowAddMembers(prevState => !prevState)
        setShowRemoveMembers(false)
    }
    
    const handleShowRemoveMembers = () => {
        fetch(url + `/groupMembers/members/${groupId}`)
            .then(response => response.json())
            .then(data => setMembers(data))
            .catch(err => console.error(err))
        setShowRemoveMembers(prevState => !prevState)
        setShowAddMembers(false)
    }

    const handleRemoveMember = (user_id) => {
        fetch(url + `/groupMembers/remove`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({ user_id, group_id: groupId })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`)
            }
            return response.json()
        })
        .then(data => {
            alert('User removed successfully!')
            setMembers(prev => prev.filter(member => member.user_id !== user_id))
        })
        .catch(err => {
            console.error('Failed to remove member:', err)
        })
    }

    const handleAddMember = (user_id) => {
        fetch(url + `/groupMembers/owner/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({ user_id, group_id: groupId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error)
            } else {
                alert('User added successfully!');
                setNonMembers(prev => prev.filter(user => user.user_id !== user_id))
            }
        })
        .catch(err => console.error(err))
    }

    const handleDeleteGroup = () => {
        if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
            fetch(url + `/groups/delete/${groupId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            })
                .then(response => {
                    if (!response.ok) throw new Error(`Failed to delete group: ${response.status}`)
                    alert('Group deleted successfully.')
                    navigate('/allgroups')
                })
                .catch(err => alert('Failed to delete group. ' + err.message))
        }
    }

    const handleDeleteFavorite = (movieId) => {
        console.log('User Token:', user.token); 
        if (window.confirm('Are you sure you want to remove this movie from the group favorites?')) {
            fetch(url + `/groups/${groupId}/favorites/${movieId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.message === 'Movie removed from group favorites') {
                    setFavorites(favorites.filter(movie => movie.id !== movieId))
                    alert('Movie removed from group favorites')
                } else {
                    alert('Failed to remove movie')
                }
            })
            .catch(err => {
                alert('Error deleting movie')
            })
        }
    }

    const handleLeaveGroup = () => {
        if (window.confirm('Are you sure you want to leave this group?')) {
            fetch(url + `/groupMembers/leave`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ group_id: groupId })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to leave the group.')
                }
                return response.json()
            })
            .then(data => {
                alert(data.message)
                navigate('/allgroups')
            })
            .catch(err => {
                alert('Error leaving group: ' + err.message)
            })
        }
    }

    const handleTransferOwnership = (newOwnerId) => {
        if (window.confirm('Do you want to transfer ownership to this user?')) {
          fetch(url + `/groups/${groupId}/transferownership`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`,
            },
            body: JSON.stringify({ newOwnerId }),
            })
            .then((response) => response.json())
            .then((data) => {
              alert('Ownership successfully transferred!')
              setShowTransferOwnership(false)
            })
            .catch((err) => {
              console.error(err)
            })
        }
    }
    
    const handleShowTransferOwnership = () => {
        fetch(url + `/groupMembers/members/${groupId}`)
            .then(response => response.json())
            .then(data => setMembers(data))
            .catch(err => console.error(err))
        setShowTransferOwnership(prevState => !prevState)
    }

    const handleDeleteShowtime = async (showtimeId) => {
        console.log("Attempting to delete showtime with ID:", showtimeId)
        
        if (!showtimeId) {
            console.error('No showtimeId provided')
            return
        }

        if (window.confirm('Are you sure you want to remove this showtime from the group?')) {
        try {
            const response = await fetch(url + `/groups/deleteShowtime/${showtimeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            })
    
            if (!response.ok) {
                throw new Error('Failed to delete showtime')
            }

            // Refresh the showtimes after deletion
            const updatedShowtimesResponse = await fetch(url + `/groups/groupShowtimes/${groupId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            })

            const updatedShowtimesData = await updatedShowtimesResponse.json()
            setGroupShowtimes(updatedShowtimesData.showings)

            console.log('Showtime deleted successfully')
        } catch (error) {
            console.error('Error deleting showtime:', error)
        }}
    }
    
    if (!group) {
        return <p>Loading...</p>
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
        <Header />
        <div className="center-item">
            <h2 className="default-big-title-white">{group.name}</h2>
            <p className="default-text">{group.description}</p>

            {user.user_id === group.owner_id && pendingRequests.length > 0 && (
                <>
                    <div>
                        {pendingRequests.map(request => (
                            <div key={request.user_id} className="join-request-box">
                                <div class="join-request-box-inside">
                                <p class="join-text">{request.email} wants to join</p>
                                <div className="join-request-buttons">
                                <button className="accept-button" onClick={() => handleAcceptRequest(request.user_id)}>
                                    <i class="fa-solid fa-check"></i></button>
                                <button className="reject-button" onClick={() => handleRejectRequest(request.user_id)}>
                                    <i class="fa-solid fa-xmark"></i></button>
                            </div></div></div>
                        ))}
                    </div>
                </>
            )}

            {user.user_id === group.owner_id && (
                <div>
                    <button onClick={handleShowTransferOwnership} className="gray-button">Transfer Ownership</button>

                {showTransferOwnership && (
                    <div className="user-list">
                        {members.map((member) => (
                            <div key={member.user_id} className="user-list-item">
                                <p>{member.email}</p>
                                <button className="default-button-pink" onClick={() => handleTransferOwnership(member.user_id)}>
                                <i class="fa-solid fa-user-tie"></i></button>
                            </div>
                ))}
                    </div>
                )}
                </div>
            )}

            <h2>Favorites</h2>
            <div class="movie-container">
                {favorites.length > 0 ? (
                    favorites.map((movie) => (
                        <div class="movie-card-gp" key={movie.id}>
                            <button className="x-mark" onClick={() => handleDeleteFavorite(movie.id)}>
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
                <p>No favorites? Tough audience.</p>
            )}</div>

            <h2>Showtimes</h2>
            <div className="results-container-gp">
                {groupShowtimes.length > 0 ? (
                    groupShowtimes.map((showtime) => (
                        <div>
                    <div className="result-card-gp" key={showtime.id}>
                    <button className="x-mark" onClick={() => handleDeleteShowtime(showtime.showing_id)}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                        <strong>{showtime.title}</strong>
                        <p>Theatre: {showtime.theater_name}</p>
                        <p>Start time: {showtime.show_time}</p>
                    </div>
                    <div class="center-item">
                        </div>
                    </div>
                    ))
                ) : (
                    <p>No showtimes available for this group.</p>
                )}
            </div>

            {user.user_id === group.owner_id && (
                <>
                <div className="button-container">
                    <button className="gray-button" onClick={handleShowNonMembers}> Add Members</button>
                    <button className="gray-button" onClick={handleShowRemoveMembers}>Remove Members</button>
                </div>
        
            {showAddMembers && (
                <div className="user-list">
                    {nonMembers.map(user => (
                        <div key={user.user_id} className="user-list-item">
                            <p>{user.email}</p>
                            <button className="default-button-pink" onClick={() => handleAddMember(user.user_id)}>
                                <i class="fa-solid fa-user-plus"></i></button>
                        </div>
                    ))}
                </div>
            )}

            {showRemoveMembers && (
                <div className="user-list">
                    {members.map(member => (
                        <div key={member.user_id} className="user-list-item">
                            <p>{member.email}</p>
                            <button className="default-button-pink" onClick={() => handleRemoveMember(member.user_id)}>
                                <i class="fa-solid fa-user-minus"></i></button>
                        </div>
                    ))}
                </div>
            )}
            <button className="danger-button" onClick={handleDeleteGroup}>
                <i class="fa-solid fa-trash"></i> Delete Group
            </button>
                </>
            )}

            {user.user_id !== group.owner_id && (
                <button className="danger-button" onClick={handleLeaveGroup}>
                    <i class="fa-solid fa-arrow-right-from-bracket"></i> Leave Group
                </button>
            )}
        </div>
        </motion.div>
    )
}