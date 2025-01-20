import React, { useState, useEffect } from "react";
import { useUser } from "../context/useUser";
import { useLocation, useNavigate } from "react-router-dom";

const url = process.env.REACT_APP_BACKEND_CONNECTION

export function AddUsers() {
    const { user } = useUser()
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [error, setError] = useState(null);
    const location = useLocation()
    const { groupId } = location.state || {}
    const navigate = useNavigate()

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch(url + '/groups/users', {
                    method: 'GET',
                    headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                    }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Failed to fetch users');
                setUsers(data);
            } catch (error) {
                setError(error.message);
            }
        };
        fetchUsers();
    }, []);

    const handleAddUsers = async () => {
        if (!groupId) {
            setError('Group ID is missing');
            return;
        }
        try {
            const response = await fetch(url + `/groups/${groupId}/addusers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ userIds: selectedUsers })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to add users to group');
            alert('Users added successfully!');
            navigate('/allgroups')
        } catch (error) {
            setError(error.message);
        }
    };

    const toggleUserSelection = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleSkip = () => {
        // Skip addusers page
        navigate('/allgroups')
    }

    return (
        <div class="select-users-page">
        <div className="page-container center-item">
            <h3 class="default-big-title-pink default-form-group">Select Users to Add to Group</h3>
            {error && <div className="error-message">{error}</div>}
            <div>
                {users.map(user => (
                    <div key={user.user_id}>
                        <label class="checkbox">
                            <input
                                type="checkbox"
                                value={user.user_id}
                                onChange={() => toggleUserSelection(user.user_id)}
                            />
                            {user.email}
                        </label>
                    </div>
                ))}
            </div>
            <div>
                <button class="default-button-pink" onClick={handleAddUsers}>Add Selected Users</button>
                <button class="default-button-pink" onClick={handleSkip}>Skip</button>
            </div>
        </div>
        </div>
    );
}
