import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase-config';
import { sendNotificationToUser } from '../../firebase/notificationService';
import { toast } from 'react-toastify';

const NotificationModal = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedUserName, setSelectedUserName] = useState('');
  const [title, setTitle] = useState('Notification');
  const [body, setBody] = useState('This is a notification from the counseling office.');
  const [notificationType, setNotificationType] = useState('Notification');
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);
  
  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  // Update title and body when user or notification type changes
  useEffect(() => {
    updateTitleAndBody();
  }, [selectedUserName, notificationType]);

  // Handle user selection change
  const handleUserChange = (e) => {
    const userId = e.target.value;
    setSelectedUser(userId);
    
    // Find the user's name
    const selectedUserObj = users.find(user => user.id === userId);
    setSelectedUserName(selectedUserObj ? selectedUserObj.name : 'User');
  };

  // Update title and body based on notification type and selected user
  const updateTitleAndBody = () => {
    // Default title based on notification type
    let newTitle;
    let newBody;
    
    switch(notificationType) {
      case 'APPOINTMENT_CONFIRMED':
        newTitle = 'Appointment Confirmed';
        newBody = `Dear ${selectedUserName}, your appointment has been confirmed. Please arrive 5 minutes before your scheduled time.`;
        break;
      case 'FOLLOW_UP':
        newTitle = 'Follow-up Reminder';
        newBody = `Dear ${selectedUserName}, this is a reminder about your upcoming follow-up session. We look forward to seeing you.`;
        break;
      case 'NO_SHOW':
        newTitle = 'Missed Appointment';
        newBody = `Dear ${selectedUserName}, we noticed you missed your scheduled counseling appointment. Please contact us to reschedule.`;
        break;
      case 'NO_RESPONSE':
        newTitle = 'Appointment Update';
        newBody = `Dear ${selectedUserName}, we've been unable to reach you regarding your counseling appointment. Please contact our office as soon as possible.`;
        break;

      case 'ONLINE':
        newTitle = 'Online Session Reminder';
        newBody = `Dear ${selectedUserName}, this is a reminder for your upcoming online counseling session. Please ensure you have a stable internet connection. <i>Add link here to the session<i>`;
        break;
      case 'ATTENDED':
        newTitle = 'Session Completed';
        newBody = `Dear ${selectedUserName}, thank you for attending your counseling session. We hope it was helpful. Please let us know if you need any further assistance.`;
        break;
      default:
        newTitle = 'Notification';
        newBody = `Dear ${selectedUserName}, you have a new notification from the counseling office.`;
    }
    
    setTitle(newTitle);
    setBody(newBody);
  };
  
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
      
      if (result && result.success) {
        toast.success('Notification sent successfully!');
        onClose(); // Close the modal on success
      } else {
        toast.error('Failed to send notification: ' + (result?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Error sending notification: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-[500px] max-w-[90%] rounded-lg shadow-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          type="button"
        >
          <span className="sr-only">Close</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold mb-6">Send Notification</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User
            </label>
            <select
              value={selectedUser}
              onChange={handleUserChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
>
  <option value="APPOINTMENT_CONFIRMED">Appointment Confirmed</option>
  <option value="FOLLOW_UP">Follow-up Reminder</option>
  <option value="NO_SHOW">Missed Appointment</option>
  <option value="NO_RESPONSE">No Response</option>
  <option value="ATTENDED">Session Completed</option>
  <option value="ONLINE">Online</option>
</select>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#3A0323] hover:bg-[#2a021a] text-white px-4 py-2 rounded-md transition-colors"
              disabled={loading || fetchingUsers || !selectedUser}
            >
              {loading ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotificationModal;