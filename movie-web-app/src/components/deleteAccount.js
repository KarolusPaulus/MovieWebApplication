import React from 'react';
import { useUser } from '../context/useUser';
import { useNavigate } from 'react-router-dom';

export default function DeleteAccount() {
    const { deleteAccount, signOut } = useUser()
    const navigate = useNavigate()

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete your account? This action cannot be undone")) {
            try {
                await deleteAccount()
                alert('Account deleted successfully')
                signOut()
                navigate('/')
            } catch (error) {
                const message = error.response && error.response.data ? error.response.data.error : error
                alert(message)
            }
        }
    }
    
    return (
        <div onClick={handleDelete} class="account-dropdown-item">DELETE ACCOUNT</div>
    )
}
