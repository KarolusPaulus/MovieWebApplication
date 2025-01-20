import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from '../context/useUser'; 
import Header from '../components/header';
import { motion } from 'framer-motion';

const url = process.env.REACT_APP_BACKEND_CONNECTION

export function CreateGroup() {
    const navigate = useNavigate();
    const { user } = useUser();
    const [groupData, setGroupData] = useState({
        name: '',
        description: ''
    });
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(url + '/groups/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    owner_id: user.user_id,
                    name: groupData.name,
                    description: groupData.description
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create group');
            }

            //Show success alert
            alert('Group created successfully! You can view your groups at Groups page.');

            // Redirect to groups page on success
            navigate('/addusers', { state: { groupId: data.group_id } });
        } catch (error) {
            setError(error.message);
        }
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
        <Header />
        <div className="page-container">
        <div>
            <h3 className="default-big-title-pink default-form-group">Create a group</h3>
            <div className="gray-box">
                {error && <div className="error-message">{error}</div>}
                <div class="gray-box-inside">
                <form onSubmit={handleSubmit} className="centered-form">
                    <div className="defaul-form-group">
                        <label className="default-text">Group name</label>
                        <input
                        className="default-input"
                            type="text"
                            value={groupData.name}
                            onChange={e => setGroupData({ ...groupData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="default-text">Description</label>
                        <input
                            className="default-input"
                            type="text"
                            value={groupData.description}
                            onChange={e => setGroupData({ ...groupData, description: e.target.value })}
                            required
                        />
                    </div>
                    <div class="center-item">
                        <button type="submit" className="wide-button">Publish Group</button>
                    </div>
                </form></div>
            </div>
        </div>
        </div>
    </motion.div>
    );
}
