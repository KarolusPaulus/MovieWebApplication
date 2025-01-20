import React from 'react';
import Header from '../components/header';
import { useState, useEffect } from 'react';
import { useUser } from '../context/useUser';
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion';

const url = process.env.REACT_APP_BACKEND_CONNECTION

export function AllGroups() {
    const [groups, setGroups] = useState([]);
    const [ownedGroups, setOwnedGroups] = useState([]);
    const [memberGroups, setMemberGroups] = useState([]);
    //const [pendingRequests, setPendingRequests] = useState({})
    const { user } = useUser();

    useEffect(() => {
        fetch(url + `/groups`)
            .then((response) => response.json())
            .then((groupsData) => {
                setGroups(groupsData);

                // Filter owned groups
                const myOwnedGroups = groupsData.filter(group => group.owner_id === user.user_id);
                setOwnedGroups(myOwnedGroups);

                // Fetch group members with user_id
                fetch(url + `/groupMembers/user/${user.user_id}`)
                    .then((response) => response.json())
                    .then((memberships) => {
                        console.log('Memberships:', memberships);
                        const acceptedGroupIds = memberships.map(member => member.group_id);
                        console.log('Accepted Group IDs:', acceptedGroupIds);

                        // Filter member groups using groupsData from outer scope
                        const myMemberGroups = groupsData.filter(group => 
                            acceptedGroupIds.includes(group.group_id)
                        );

                        console.log('My Member Groups:', myMemberGroups);
                        setMemberGroups(myMemberGroups);
                    })
                    .catch((err) => console.error('Error fetching group members:', err));
            })
            .catch((err) => console.error(err));
    }, [user.user_id]);
    
    const handleJoinRequest = (group_id) => {
        fetch(url + `/groupMembers/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.user_id, group_id })
        })
          .then(response => response.json())
          .then(data => {
            console.log('Join request sent:', data)
            alert('Join request sent')
          })
          .catch(err => console.error(err))
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
            <div className="groups-page">
            <div class="center-item">
                <h2 className="default-medium-title">My Groups (Owner)</h2>
            </div>
            {ownedGroups.length > 0 ? (
                <div className="group-list">
                    {ownedGroups.map((group) => (
                        <div className="group-card" key={group.group_id}>
                            <div>
                            <h3 className="group-name">
                                <Link className="default-link-text" to={`/grouppage/${group.group_id}`}>{group.name}</Link></h3>
                            <p className="group-description">{group.description}</p>
                        </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="no-groups-message">You are not the owner of any groups.</p>
            )}

            <div className="center-item">
                 <button className="default-button-pink"><Link className="default-link-text" to="/creategroup">
                    <i class="fa-solid fa-plus"></i> Create New Group</Link> </button>
            </div>

            <div class="center-item">
            <h2 className="default-medium-title">Groups I'm a Member Of</h2>
                </div>
                {memberGroups.length > 0 ? (
                    <div className="group-list">
                        {memberGroups.map((group) => (
                            <div className="group-card" key={group.group_id}>
                                <div>
                                <h3 className="group-name">
                                <Link className="default-link-text"  to={`/grouppage/${group.group_id}`}>{group.name}</Link>
                                </h3>
                                <p className="group-description">{group.description}</p>
                            </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="no-groups-message">You are not a member of any groups.</p>
                )}
            <div class="center-item">
                <h2 className="default-medium-title">All Groups</h2>
            </div>
            {groups.length > 0 ? (
                <div className="group-list">
                    {groups.map((group) => {
                        const isMemberOrOwner = memberGroups.some(g => g.group_id === group.group_id) || ownedGroups.some(g => g.group_id === group.group_id)
                        
                        return (
                            <div className="group-card" key={group.group_id}>
                            <div>
                                <h3 className="group-name">
                                    <Link className="default-link-text" to={`/grouppage/${group.group_id}`}>{group.name}</Link>
                                </h3>
                                <p className="group-description">{group.description}</p>
                            </div>
                                    {!isMemberOrOwner && (
                                        <button className="join-button" onClick={() => handleJoinRequest(group.group_id)}>JOIN</button>
                                    )}
                            </div>
                            )
                        })}
                </div>
                ) : (
                    <p className="no-groups-message">You are not the owner of any groups.</p>
                )}
            </div>
        </motion.div>
    )
}
