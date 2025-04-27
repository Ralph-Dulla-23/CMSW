// src/pages/admin/NotificationTestPage.jsx
import React, { useState, useEffect } from 'react';
import AdminNavbar from '../ui/adminnavbar';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase-config';
import { sendNotificationToUser } from '../../firebase/notificationService';
import { toast } from 'react-toastify';

function NotificationTestPage() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [title, setTitle] = useState('Test Notification');
    const [body, setBody] = useState('This is a test notification from the admin panel.');
    const [notificationType, setNotificationType] = useState('TEST');
    const [loading, setLoading] = useState(false);
    const [fetchingUsers, setFetchingUsers] = useState(true);
    const [userFilter, setUserFilter] = useState('');
    
    useEffect(() => {
      // Fetch users from multiple collections
      const fetchUsers = async () => {
        try {
          setFetchingUsers(true);
          const uniqueUsers = new Map(); // Using Map to store user details with ID as key
          
          // 1. Fetch from counselingForms collection
          const formsSnapshot = await getDocs(collection(db, 'counselingForms'));
          formsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.userId && !uniqueUsers.has(data.userId)) {
              uniqueUsers.set(data.userId, {
                id: data.userId,
                name: data.firstName ? `${data.firstName} ${data.lastName || ''}` : data.userId,
                email: data.email || '',
                source: 'counselingForms'
              });
            }
          });
          
          // 2. Fetch from users collection (if you have one)
          try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            usersSnapshot.forEach(doc => {
              const data = doc.data();
              if (!uniqueUsers.has(doc.id)) {
                uniqueUsers.set(doc.id, {
                  id: doc.id,
                  name: data.displayName || data.firstName ? `${data.firstName} ${data.lastName || ''}` : data.email || doc.id,
                  email: data.email || '',
                  source: 'users'
                });
              }
            });
          } catch (error) {
            console.warn('Error fetching from users collection (might not exist):', error);
          }
          
          // 3. Fetch from authentication users (if using Firebase Auth)
          try {
            // This requires either using Firebase Admin SDK on server side
            // or having a users collection that mirrors your auth users
            // We're assuming you have a users collection
          } catch (error) {
            console.warn('Error fetching auth users:', error);
          }
          
          // Convert Map to array and sort by name
          const usersArray = Array.from(uniqueUsers.values()).sort((a, b) => 
            a.name.localeCompare(b.name)
          );
          
          setUsers(usersArray);
          console.log(`Fetched ${usersArray.length} unique users`);
        } catch (error) {
          console.error('Error fetching users:', error);
          toast.error('Failed to load users: ' + error.message);
        } finally {
          setFetchingUsers(false);
        }
      };
      
      fetchUsers();
    }, []);
    
    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!selectedUser) {
        toast.error('Please select a user');
        return;
      }
      
      setLoading(true);
      
      try {
        const result = await sendNotificationToUser(
          selectedUser,
          title,
          body,
          {
            type: notificationType,
            timestamp: Date.now()
          }
        );
        
        if (result.success) {
          toast.success('Notification sent successfully!');
        } else {
          toast.error('Failed to send notification: ' + result.error);
        }
      } catch (error) {
        console.error('Error sending notification:', error);
        toast.error('Error sending notification: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminNavbar />
        
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Notification Test Tool</h1>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    disabled={fetchingUsers}
                  >
                    <option value="">Select a user</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} {user.email ? `(${user.email})` : ''}
                      </option>
                    ))}
                  </select>
                  {fetchingUsers && (
                    <p className="mt-1 text-sm text-gray-500">Loading users...</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notification Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notification Body
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notification Type
                  </label>
                  <select
                    value={notificationType}
                    onChange={(e) => setNotificationType(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="TEST">Test Notification</option>
                    <option value="APPOINTMENT_CONFIRMED">Appointment Confirmed</option>
                    <option value="SESSION_UPDATE">Session Update</option>
                    <option value="FOLLOW_UP">Follow-up Reminder</option>
                  </select>
                </div>
                
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={loading || fetchingUsers}
                >
                  {loading ? 'Sending...' : 'Send Notification'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  export default NotificationTestPage;