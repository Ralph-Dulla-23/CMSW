// src/firebase/notificationService.js

import { db } from './firebase-config';
import { 
  collection, 
  addDoc, 
  Timestamp,
  getDocs,
  query,
  where,
  updateDoc,
  doc
} from 'firebase/firestore';

/**
 * Sends a notification to a specific user
 * @param {string} userId - The user ID to send notification to
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data for the notification
 * @returns {Object} - Success status or error message
 */
export const sendNotificationToUser = async (userId, title, body, data = {}) => {
  try {
    console.log("Sending notification to user:", userId);
    
    if (!userId) {
      console.error("No userId provided for notification");
      return { success: false, error: "User ID is required for sending notifications" };
    }

    // Create a notification document in Firestore
    const notificationData = {
      userId: userId,
      title: title,
      body: body,
      data: data,
      read: false,
      sent: false, // This will be used by the FCM cloud function
      createdAt: new Date().toISOString(),
      createdAtTimestamp: Timestamp.now(), // Add a Firestore timestamp for queries
    };
    
    const notificationRef = await addDoc(collection(db, "notifications"), notificationData);
    
    console.log('Notification created with ID:', notificationRef.id);
    return { success: true, notificationId: notificationRef.id };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
};