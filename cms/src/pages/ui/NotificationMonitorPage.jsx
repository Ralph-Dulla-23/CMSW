// src/pages/admin/NotificationMonitorPage.jsx
import React, { useState, useEffect } from 'react';
import AdminNavbar from '../ui/adminnavbar';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase-config';

function NotificationMonitorPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const q = query(
          collection(db, 'notifications'),
          orderBy('createdAtTimestamp', 'desc'),
          limit(50)
        );
        
        const querySnapshot = await getDocs(q);
        const notificationsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setNotifications(notificationsList);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Notification Monitor</h1>
            
            {loading ? (
              <p>Loading notifications...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Body</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {notifications.map(notification => (
                      <tr key={notification.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{notification.id.substring(0, 8)}...</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{notification.userId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{notification.title}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{notification.body}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {notification.sent ? 'Sent' : 'Pending'} / {notification.read ? 'Read' : 'Unread'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'Unknown'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationMonitorPage;