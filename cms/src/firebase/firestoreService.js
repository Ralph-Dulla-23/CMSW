  // src/firebase/firestoreService.js

  import { db } from './firebase-config';
  // At the top of firestoreService.js, add Timestamp to your imports
  import { 
    collection, 
    addDoc, 
    getDocs, 
    getDoc, 
    updateDoc, 
    doc, 
    query, 
    where, 
    orderBy, 
    limit, 
    serverTimestamp, 
    Timestamp,
    deleteDoc,
    writeBatch// Add this import
  } from 'firebase/firestore';

  /**
   * Submits a student interview form to Firestore.
   * @param {Object} formData - The form data to be submitted.
   * @returns {Object} - Success status and document ID or error message.
   */
  export const submitStudentInterviewForm = async (formData) => {
    try {
      // Process the form data if it's from mobile
      const processedData = await processMobileFormData(formData);
      
      if (!processedData.success) {
        throw new Error("Failed to process form data: " + processedData.error);
      }
      
      const enhancedFormData = processedData.formData;
      
      // Validate form data before submission
      if (!enhancedFormData.fullName && !enhancedFormData.studentName) {
        throw new Error("Student name is required.");
      }
      
      // Add document to Firestore collection
      const docRef = await addDoc(collection(db, "counselingForms"), enhancedFormData);
      console.log("Document written with ID: ", docRef.id);
      
      // Send notification for new submission if userId exists
      if (enhancedFormData.userId) {
        await sendNotificationToUser(
          enhancedFormData.userId,
          'Counseling Request Received',
          'Your counseling request has been submitted successfully. We will review it shortly.',
          {
            type: 'NEW_REQUEST',
            formId: docRef.id
          }
        );
      }
      
      return { success: true, docId: docRef.id };
    } catch (error) {
      console.error("Error adding document: ", error);
      return { success: false, error: error.message };
    }
  };


  export const getActiveCounselingForms = async () => {
    try {
      console.log("Fetching all active counseling forms...");
      
      // Get all forms from the counselingForms collection
      const querySnapshot = await getDocs(collection(db, "counselingForms"));
      console.log(`Found ${querySnapshot.size} total forms in counselingForms collection`);
      
      const forms = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`Form ${doc.id}:`, data);
        
        // Only exclude forms that are explicitly marked as "Completed"
        if (data.status !== 'Completed') {
          forms.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      console.log(`After filtering, ${forms.length} active forms remain`);
      return { success: true, forms };
    } catch (error) {
      console.error('Error getting active counseling forms:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Fetches all student interview forms from Firestore.
   * @returns {Object} - Success status and forms or error message.
   */
  export const getStudentInterviewForms = async () => {
    try {
      console.log("Checking admin status from localStorage");
      // Simple admin check based on localStorage
      const isAdmin = localStorage.getItem('userRole') === 'admin' && 
                    localStorage.getItem('userEmail') === 'admin@gmail.com';
      
      if (!isAdmin) {
        console.log("Not admin - access denied");
        return { 
          success: false, 
          error: "Unauthorized access. Only administrators can view all forms."
        };
      }

      console.log("Admin access confirmed, fetching forms...");
      
      try {
        // Direct fetch without authentication checks
        // Make sure this matches your actual collection name
        const querySnapshot = await getDocs(collection(db, "counselingForms"));
        console.log("Raw query result count:", querySnapshot.size);
        
        const forms = [];
        querySnapshot.forEach((doc) => {
          forms.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log(`Successfully fetched ${forms.length} forms`);
        
        // Log status distribution for debugging
        const statusCounts = {};
        forms.forEach(form => {
          const status = form.status || 'Undefined';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        console.log("Status distribution:", statusCounts);
        
        return { success: true, forms };
      } catch (fetchError) {
        console.error("Error in Firestore fetch operation:", fetchError);
        return { 
          success: false, 
          error: `Firestore fetch error: ${fetchError.message}` 
        };
      }
    } catch (error) {
      console.error("Error getting documents: ", error);
      return { success: false, error: error.message };
    }
  };

  export const updateFormStatus = async (formId, status, remarks, additionalData = {}) => {
    try {
      console.log("DEBUG - updateFormStatus called with:", { formId, status, remarks, additionalData });
      
      // Check if the user is an admin
      const isAdmin = localStorage.getItem('userRole') === 'admin' && 
                     localStorage.getItem('userEmail') === 'admin@gmail.com';
      
      if (!isAdmin) {
        return { 
          success: false, 
          error: "Unauthorized access. Only administrators can update forms."
        };
      }
  
      // Get the current form data to retrieve userId and compare status
      const formRef = doc(db, "counselingForms", formId);
      const formDoc = await getDoc(formRef);
      
      if (!formDoc.exists()) {
        return { success: false, error: "Form not found" };
      }
      
      const formData = formDoc.data();
      console.log("DEBUG - Form data retrieved:", formData);
      
      const oldStatus = formData.status || 'Pending';
      const oldRemarks = formData.remarks || '';
      const userId = formData.userId;
      
      console.log("DEBUG - userId from form:", userId);
      console.log("DEBUG - oldStatus:", oldStatus);
      console.log("DEBUG - status to set:", status);
  
      // Prepare update data with additional data included
      const updateData = {
        updatedAt: new Date().toISOString(),
        ...additionalData
      };
  
      // Store previous status if it exists
      updateData.previousStatus = oldStatus;
  
      // Add status if provided
      if (status) {
        updateData.status = status;
      } else if (additionalData.status) {
        updateData.status = additionalData.status;
      } else if (remarks && remarks !== 'Follow up' && remarks !== oldRemarks) {
        updateData.status = 'Completed';
      }
  
      // Add remarks if provided
      if (remarks) {
        updateData.remarks = remarks;
      }
  
      console.log("DEBUG - Updating document with:", updateData);
      
      // Update the document in Firestore
      await updateDoc(formRef, updateData);
      console.log("DEBUG - Document updated successfully");
  
      // Send notification based on the type of update
      if (userId) {
        console.log("DEBUG - Preparing to send notification to user:", userId);
        
        // STAGE 1: Initial Confirmation
        if (status === 'Confirmed' && oldStatus !== 'Confirmed' && !additionalData.isFollowUp) {
          console.log("DEBUG - Sending appointment confirmation notification");
          const notificationResult = await sendNotificationToUser(
            userId,
            'Appointment Confirmed',
            `Your counseling appointment has been confirmed. Please check your schedule for details.`,
            {
              type: 'APPOINTMENT_CONFIRMED',
              formId: formId
            }
          );
          console.log("DEBUG - Notification result:", notificationResult);
        }
        // Other notification conditions...
      } else {
        console.log("DEBUG - No userId found, skipping notification");
      }
  
      return { success: true };
    } catch (error) {
      console.error("DEBUG - Error in updateFormStatus:", error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Sends a notification about a follow-up appointment
   * @param {string} formId - The form ID
   * @param {string} userId - The user ID to notify
   * @param {Object} formData - The current form data
   * @param {string} followUpDate - The scheduled follow-up date
   * @returns {Object} - Success status or error message
   */
  export const notifyFollowUp = async (formId, userId, formData, followUpDate, followUpTime = null) => {
    try {
      if (!followUpDate) {
        console.warn('Follow-up notification attempted without a date');
        return { success: false, error: "Follow-up date is required" };
      }
      
      const formattedDate = new Date(followUpDate).toLocaleDateString();
      const timeMessage = followUpTime ? ` at ${followUpTime}` : '';
      
      return await sendNotificationToUser(
        userId,
        'Follow-up Appointment Confirmed',
        `A follow-up appointment has been scheduled and confirmed for ${formattedDate}${timeMessage}. Please attend at the scheduled time.`,
        {
          type: 'FOLLOW_UP',
          formId: formId,
          followUpDate: followUpDate,
          followUpTime: followUpTime,
          autoConfirmed: true
        }
      );
    } catch (error) {
      console.error('Error sending follow-up notification:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Updates a session's status
   * @param {string} sessionId - The ID of the session to update
   * @param {string} status - The new status
   * @returns {Object} - Success status or error message
   */
  export const updateSessionStatus = async (sessionId, status) => {
    try {
      // Check if the user is an admin
      const isAdmin = localStorage.getItem('userRole') === 'admin' && 
                    localStorage.getItem('userEmail') === 'admin@gmail.com';
      
      if (!isAdmin) {
        return { 
          success: false, 
          error: "Unauthorized access. Only administrators can update sessions."
        };
      }

      // Get the current session data
      const sessionRef = doc(db, "counselingForms", sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (!sessionDoc.exists()) {
        return { success: false, error: "Session not found" };
      }
      
      const sessionData = sessionDoc.data();
      const oldStatus = sessionData.status;
      const userId = sessionData.userId;

      // Update the document in Firestore
      await updateDoc(sessionRef, {
        status,
        previousStatus: oldStatus,
        updatedAt: new Date().toISOString()
      });

      // Send notification if status changed and userId exists
      if (status !== oldStatus && userId) {
        await notifyStatusChange(sessionId, status, userId, sessionData);
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating session status:", error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Gets forms for a specific student
   * @param {string} studentEmail - The email of the student
   * @returns {Object} - Success status and forms or error message
   */
  export const getStudentForms = async (studentEmail) => {
    try {
      if (!studentEmail) {
        return { success: false, error: "Student email is required" };
      }
      
      const q = query(
        collection(db, "counselingForms"),
        where("email", "==", studentEmail)
      );
      
      const querySnapshot = await getDocs(q);
      const forms = [];
      
      querySnapshot.forEach((doc) => {
        forms.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, forms };
    } catch (error) {
      console.error("Error getting student forms:", error);
      return { success: false, error: error.message };
    }
  };


  /**
   * Sets dates as unavailable for counseling
   * @param {Array} dates - Array of date strings in YYYY-MM-DD format
   * @param {string} reason - Optional reason why dates are unavailable
   * @returns {Object} - Success status or error message
   */
  // In firestoreService.js
  export const setUnavailableDates = async (dates, reason = "") => {
    console.log("setUnavailableDates called with:", dates, reason);
    
    try {
      // Check if the user is an admin
      const isAdmin = localStorage.getItem('userRole') === 'admin' && 
                    localStorage.getItem('userEmail') === 'admin@gmail.com';
      
      if (!isAdmin) {
        return { 
          success: false, 
          error: "Unauthorized access. Only administrators can set unavailable dates."
        };
      }

      // Validate input
      if (!Array.isArray(dates) || dates.length === 0) {
        return { success: false, error: "At least one date must be provided" };
      }

      // Create batch for multiple operations
      const batch = writeBatch(db);
      
      // Process each date
      for (const dateStr of dates) {
        if (!dateStr) continue;
        
        // Create a document ID based on the date for easy retrieval/updates
        const docId = `unavailable_${dateStr}`;
        const dateRef = doc(db, "unavailableDates", docId);
        
        batch.set(dateRef, {
          date: dateStr,
          reason: reason,
          createdAt: new Date().toISOString(),
          createdBy: localStorage.getItem('userEmail') || 'admin',
        });
      }
      
      // Commit the batch
      await batch.commit();
      console.log("Batch committed successfully");
      
      return { 
        success: true, 
        message: `Successfully marked ${dates.length} date(s) as unavailable`
      };
    } catch (error) {
      console.error("Error setting unavailable dates:", error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Gets all unavailable dates
   */
  export const getUnavailableDates = async () => {
    console.log("getUnavailableDates called");
    
    try {
      const querySnapshot = await getDocs(collection(db, "unavailableDates"));
      console.log("Unavailable dates query result count:", querySnapshot.size);
      
      const unavailableDates = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        if (data && data.date) {
          unavailableDates.push({
            date: data.date,
            reason: data.reason || ""
          });
        }
      });
      
      console.log("Processed unavailable dates:", unavailableDates);
      return { 
        success: true, 
        dates: unavailableDates
      };
    } catch (error) {
      console.error("Error getting unavailable dates:", error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Removes dates from the unavailable list
   */
  export const removeUnavailableDates = async (dates) => {
    console.log("removeUnavailableDates called with:", dates);
    
    try {
      // Check if the user is an admin
      const isAdmin = localStorage.getItem('userRole') === 'admin' && 
                    localStorage.getItem('userEmail') === 'admin@gmail.com';
      
      if (!isAdmin) {
        return { 
          success: false, 
          error: "Unauthorized access. Only administrators can update unavailable dates."
        };
      }

      // Validate input
      if (!Array.isArray(dates) || dates.length === 0) {
        return { success: false, error: "At least one date must be provided" };
      }

      // Create batch for multiple operations
      const batch = writeBatch(db);
      
      // Process each date
      for (const dateStr of dates) {
        if (!dateStr) continue;
        
        const docId = `unavailable_${dateStr}`;
        const dateRef = doc(db, "unavailableDates", docId);
        
        batch.delete(dateRef);
      }
      
      // Commit the batch
      await batch.commit();
      console.log("Batch deletion committed successfully");
      
      return { 
        success: true, 
        message: `Successfully removed ${dates.length} date(s) from unavailable list`
      };
    } catch (error) {
      console.error("Error removing unavailable dates:", error);
      return { success: false, error: error.message };
    }
  };
  /**
   * Sends a notification to a specific user by creating a notification document in Firestore
   * @param {string} userId - The user ID to send notification to
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} data - Additional data for the notification
   * @returns {Object} - Success status or error message
   */
  export const debugNotification = async (userId) => {
  try {
    console.log("Creating test notification for user:", userId);
    
    if (!userId) {
      console.error("No userId provided");
      return { success: false, error: "User ID is required" };
    }
    
    // Create a test notification
    const notificationRef = await addDoc(collection(db, "notifications"), {
      userId: userId,
      title: "Test Notification from Web",
      body: `This is a test notification created at ${new Date().toISOString()}`,
      data: {
        type: "TEST",
        formId: `test-${Date.now()}`
      },
      sent: false,
      read: false,
      createdAt: new Date().toISOString(),
      createdAtTimestamp: Timestamp.now(),
    });
    
    console.log("Test notification created with ID:", notificationRef.id);
    
    // Wait a moment and check if it was processed
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const notificationDoc = await getDoc(doc(db, "notifications", notificationRef.id));
    if (notificationDoc.exists()) {
      const data = notificationDoc.data();
      console.log("Notification status after 5 seconds:", {
        id: notificationRef.id,
        sent: data.sent,
        read: data.read,
        sentAt: data.sentAt
      });
    } else {
      console.log("Notification no longer exists");
    }
    
    return { 
      success: true, 
      notificationId: notificationRef.id 
    };
  } catch (error) {
    console.error("Error in debugNotification:", error);
    return { success: false, error: error.message };
  }
};

  export const processMobileFormData = async (formData) => {
    try {
      // Check if this is a mobile submission (has the new structure)
      const isMobileSubmission = formData.academics && formData.personal;
      
      if (!isMobileSubmission) {
        // Handle the old format submissions as before
        return { success: true, formData };
      }
      
      // Process the new mobile form structure
      const enhancedFormData = {
        // Basic info
        fullName: formData.fullName || '',
        email: formData.email || '',
        status: 'Pending',
        submissionDate: new Date().toISOString(),
        type: formData.selectedMode || 'Walk-in',
        referral: 'Self', // Default
        remarks: '',
        isReferral: false,
        userId: formData.uicId || null,
        
        // Student details
        studentName: formData.fullName || '',
        studentId: formData.uicId || '',
        courseYearSection: `${formData.college || ''} - Year ${formData.year || ''}${formData.section ? ` Section ${formData.section}` : ''}`,
        dateOfBirth: formData.dob || '',
        ageSex: `${formData.age || ''} / ${formData.sex || ''}`,
        contactNo: formData.contact || '',
        presentAddress: formData.address || '',
        emergencyContactPerson: formData.emergencyContact || '',
        emergencyContactNo: formData.emergencyContactNo || '',
        
        // Appointment details
        scheduledDate: formData.selectedDate || '',
        scheduledTime: formData.selectedTime || '',
        
        // Store all the nested data as is
        academics: formData.academics || {},
        personal: formData.personal || {},
        family: formData.family || {},
        interpersonal: formData.interpersonal || {},
        griefBereavement: formData.griefBereavement || {},
        gettingToKnowYou: formData.gettingToKnowYou || {},
        
        // Transformed areas of concern for backward compatibility
        areasOfConcern: {
          personal: extractPersonalConcernsArray(formData.personal),
          academic: extractAcademicConcernsArray(formData.academics),
          family: extractFamilyConcernsArray(formData.family),
          interpersonal: extractInterpersonalConcernsArray(formData.interpersonal)
        }
      };
      
      return { success: true, formData: enhancedFormData };
    } catch (error) {
      console.error("Error processing mobile form data:", error);
      return { success: false, error: error.message };
    }
  };

  // Helper functions to extract concern arrays for backward compatibility
  function extractPersonalConcernsArray(personal) {
    if (!personal) return [];
    
    const concerns = [];
    if (personal.confident) concerns.push('notConfident');
    if (personal.decision) concerns.push('hardTimeDecisions');
    if (personal.sleeping) concerns.push('problemSleeping');
    if (personal.mood) concerns.push('moodNotStable');
    return concerns;
  }

  function extractAcademicConcernsArray(academics) {
    if (!academics) return [];
    
    const concerns = [];
    if (academics.overlyWorried) concerns.push('overlyWorriedAcademic');
    if (academics.notPrepared) concerns.push('notMotivatedStudy');
    if (academics.difficultyUnderstanding) concerns.push('difficultyUnderstanding');
    return concerns;
  }

  function extractFamilyConcernsArray(family) {
    if (!family) return [];
    
    const concerns = [];
    if (family.hardTimeWithParents) concerns.push('hardTimeDealingParents');
    if (family.familyOpeningUp) concerns.push('difficultyOpeningUp');
    if (family.familyFinancialConcern) concerns.push('financialConcerns');
    return concerns;
  }

  function extractInterpersonalConcernsArray(interpersonal) {
    if (!interpersonal) return [];
    
    const concerns = [];
    if (interpersonal.isBullied) concerns.push('beingBullied');
    if (interpersonal.cannotHandlePressure) concerns.push('cannotHandlePeerPressure');
    if (interpersonal.difficultyGettingAlong) concerns.push('difficultyGettingAlong');
    return concerns;
  }

  export const sendNotificationToUser = async (userId, title, body, data = {}) => {
    try {
      console.log("NOTIFICATION DEBUG - Starting to send notification");
      console.log("NOTIFICATION DEBUG - userId:", userId);
      console.log("NOTIFICATION DEBUG - title:", title);
      console.log("NOTIFICATION DEBUG - body:", body);
      console.log("NOTIFICATION DEBUG - data:", data);
      
      if (!userId) {
        console.error("NOTIFICATION DEBUG - No userId provided for notification");
        return { success: false, error: "User ID is required for sending notifications" };
      }
  
      // Create a notification document in Firestore
      const notificationData = {
        userId: userId,
        title: title,
        body: body,
        data: data,
        sent: false,
        read: false,
        createdAt: new Date().toISOString(),
        createdAtTimestamp: Timestamp.now(), // Add a Firestore timestamp for queries
      };
      
      console.log("NOTIFICATION DEBUG - Creating document with data:", notificationData);
      
      const notificationRef = await addDoc(collection(db, "notifications"), notificationData);
      
      console.log('NOTIFICATION DEBUG - Notification created with ID:', notificationRef.id);
      return { success: true, notificationId: notificationRef.id };
    } catch (error) {
      console.error('NOTIFICATION DEBUG - Error sending notification:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Notifies a user about a status change
   * @param {string} formId - The form ID that was updated
   * @param {string} newStatus - The new status
   * @param {string} userId - The user ID to notify
   * @param {Object} formData - The current form data
   * @param {Object} additionalData - Any additional data from the update
   * @returns {Object} - Success status or error message
   */
  export const notifyStatusChange = async (formId, newStatus, userId, formData, additionalData = {}) => {
    try {
      // Prepare notification content based on status or remarks
      let title, body;
      
      // If this is a remarks-based change, use the remarks value for notification
      if (formData.remarksChange) {
        switch(formData.remarksChange) {
          case 'Attended':
            title = 'Session Attended';
            body = 'Your counseling session has been marked as attended. Thank you for your participation.';
            break;
            
          case 'No Show':
            title = 'Missed Session';
            body = 'You were marked as absent for your counseling session. Please contact the office to reschedule.';
            break;
            
          case 'No Response':
            title = 'No Response Recorded';
            body = 'You did not respond to your counseling session confirmation. Please contact the office for assistance.';
            break;
            
          case 'Terminated':
            title = 'Session Terminated';
            body = 'Your counseling session has been terminated. Please contact the counseling office for more information.';
            break;
            
          default:
            title = 'Session Update';
            body = `Your counseling session status has been updated to ${formData.remarksChange}.`;
        }
      } else {
        // Original status-based notifications
        switch(newStatus) {
          case 'Confirmed':
            title = 'Session Confirmed';
            body = 'Your counseling session has been confirmed. Please check your schedule for details.';
            break;
            
          case 'Rescheduled':
            const date = additionalData.scheduledDate || formData.scheduledDate || 'the new date';
            const time = additionalData.scheduledTime || formData.scheduledTime || 'the scheduled time';
            title = 'Session Rescheduled';
            body = `Your counseling session has been rescheduled to ${date} at ${time}.`;
            break;
            
          case 'Cancelled':
            title = 'Session Cancelled';
            body = 'Your counseling session has been cancelled. Please contact the counseling office for more information.';
            break;
            
          case 'Completed':
            title = 'Session Completed';
            body = 'Your counseling session has been marked as completed. Thank you for attending.';
            break;
            
          case 'No-show':
          case 'No Show':
            title = 'Missed Session';
            body = 'You were marked as absent for your counseling session. Please contact the office to reschedule.';
            break;
            
          case 'Reviewed':
            title = 'Request Reviewed';
            body = 'Your counseling request has been reviewed. Please check your schedule for details.';
            break;
            
          case 'Pending':
            title = 'Request Pending';
            body = 'Your counseling request is pending review. We will notify you once it has been processed.';
            break;
            
          default:
            title = 'Session Update';
            body = `Your counseling session status has been updated to ${newStatus}.`;
        }
      }
      
      // Send the notification
      return await sendNotificationToUser(userId, title, body, {
        type: 'SESSION_UPDATE',
        formId: formId,
        status: newStatus,
        remarks: formData.remarksChange || formData.remarks
      });
      
    } catch (error) {
      console.error('Error in notifyStatusChange:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Sends a reminder notification for an upcoming session
   * @param {string} formId - The form/session ID
   * @param {string} userId - The user ID to notify
   * @param {Date} sessionDate - The date of the session
   * @returns {Object} - Success status or error message
   */
  export const sendSessionReminder = async (formId, userId, sessionDate) => {
    try {
      if (!userId || !sessionDate) {
        return { success: false, error: "User ID and session date are required" };
      }
      
      const formattedDate = new Date(sessionDate).toLocaleDateString();
      const formattedTime = new Date(sessionDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      return await sendNotificationToUser(
        userId,
        'Upcoming Counseling Session',
        `Reminder: You have a counseling session scheduled for ${formattedDate} at ${formattedTime}.`,
        {
          type: 'SESSION_REMINDER',
          formId: formId,
        }
      );
    } catch (error) {
      console.error('Error sending session reminder:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Sends a direct message notification to a user
   * @param {string} userId - The user ID to notify
   * @param {string} message - The message to send
   * @param {string} senderName - Name of the sender (e.g., "Counselor Smith")
   * @returns {Object} - Success status or error message
   */

  /**
   * Deletes old sent notifications to keep the database clean
   * Typically would be called periodically or by an admin action
   * @param {number} daysOld - Delete notifications older than this many days
   * @returns {Object} - Success status or error message
   */
  // Fix the closing brace of cleanupOldNotifications and add sendTestNotification as a separate function
  export const cleanupOldNotifications = async (daysOld = 30) => {
    try {
      // Check if the user is an admin
      const isAdmin = localStorage.getItem('userRole') === 'admin' && 
                    localStorage.getItem('userEmail') === 'admin@gmail.com';
      
      if (!isAdmin) {
        return { 
          success: false, 
          error: "Unauthorized access. Only administrators can cleanup notifications."
        };
      }
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      const cutoffTimestamp = Timestamp.fromDate(cutoffDate);
      
      // Query for old, sent notifications
      const q = query(
        collection(db, "notifications"),
        where("sent", "==", true),
        where("createdAtTimestamp", "<", cutoffTimestamp),
        limit(500) // Process in batches for large collections
      );
      
      const querySnapshot = await getDocs(q);
      
      // Delete each notification
      let deleteCount = 0;
      for (const document of querySnapshot.docs) {
        await deleteDoc(doc(db, "notifications", document.id));
        deleteCount++;
      }
      
      return { 
        success: true, 
        message: `Deleted ${deleteCount} old notifications`,
        count: deleteCount
      };
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      return { success: false, error: error.message };
    }
  }; // This is the correct closing brace for cleanupOldNotifications

  /**
   * Gets all student interview forms that are not explicitly marked as completed
   * @returns {Object} - Success status and forms data
   */
  export const getActiveInterviewForms = async () => {
    try {
      console.log("Fetching all active interview forms without strict filtering...");
      
      
      const querySnapshot = await getDocs(collection(db, "counselingForms"));
      console.log(`Found ${querySnapshot.size} total forms in counselingForms collection`);
      
      const forms = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`Form ${doc.id}:`, data);
        
        // Only exclude forms that are explicitly marked as "Completed"
        // If status is undefined or anything other than "Completed", include it
        if (data.status !== 'Completed') {
          forms.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      console.log(`After filtering, ${forms.length} active forms remain`);
      return { success: true, forms };
    } catch (error) {
      console.error('Error getting active interview forms:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Gets only completed student interview forms (for history)
   * @returns {Object} - Success status and forms data
   */
  export const getCompletedInterviewForms = async () => {
    try {
      console.log("Fetching completed interview forms...");
      
      // Check admin status
      const isAdmin = localStorage.getItem('userRole') === 'admin' && 
                    localStorage.getItem('userEmail') === 'admin@gmail.com';
      
      if (!isAdmin) {
        return { 
          success: false, 
          error: "Unauthorized access. Only administrators can view forms."
        };
      }
      
      // Get all forms
      const formsCollection = collection(db, "counselingForms");
      const querySnapshot = await getDocs(formsCollection);
      
      const forms = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Only include forms that are completed
        if (data.status === 'Completed') {
          forms.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      console.log(`Successfully fetched ${forms.length} completed forms`);
      return { success: true, forms };
    } catch (error) {
      console.error('Error getting completed interview forms:', error);
      return { success: false, error: error.message };
    }
  };

  export const submitReferral = async (referralData) => {
    try {
      // Validate required fields
      if (!referralData.clientName || !referralData.referredBy) {
        throw new Error("Required fields are missing.");
      }

      // Transform referral data to match counselingForms structure
      const enhancedReferralData = {
        // Basic info
        fullName: referralData.clientName || '',
        email: referralData.email || '',
        status: 'Pending',
        submissionDate: new Date().toISOString(),
        type: 'Referral', // Mark as referral
        referral: referralData.referredBy || 'Faculty',
        remarks: referralData.remarks || '',
        isReferral: true, // Important flag to identify referrals
        
        // Original referral data (keep for reference)
        referralData: {
          ...referralData
        },
        
        // Add required fields for compatibility with counselingForms
        college: referralData.courseYear?.split(' ')[0] || '',
        selectedDate: referralData.date || '',
        
        // Structured concerns to match counselingForms format
        academics: processReferralAcademicConcerns(referralData.academicConcerns),
        personal: processReferralPersonalConcerns(referralData.personalConcerns),
        
        // Add metadata
        convertedFromReferral: true,
        referralCreatedAt: new Date().toISOString()
      };

      // Add to counselingForms collection
      const docRef = await addDoc(collection(db, "counselingForms"), enhancedReferralData);
      console.log("Referral added to counselingForms with ID: ", docRef.id);
      
      // Also add to original referrals collection for backward compatibility
      await addDoc(collection(db, "referrals"), referralData);
      
      return { success: true, docId: docRef.id };
    } catch (error) {
      console.error("Error adding referral: ", error);
      return { success: false, error: error.message };
    }
  };

  // Helper functions to process referral concerns
  function processReferralAcademicConcerns(academicConcerns) {
    if (!academicConcerns) return {};
    
    // Create a structure that matches the counselingForms academics format
    const result = {
      academicOthers: typeof academicConcerns === 'string' ? academicConcerns : ''
    };
    
    // If academicConcerns is an array, process it
    if (Array.isArray(academicConcerns)) {
      academicConcerns.forEach(concern => {
        // Map common academic concerns
        if (concern.includes('difficulty understanding')) {
          result.difficultyUnderstanding = true;
        }
        if (concern.includes('not motivated')) {
          result.notPrepared = true;
        }
        if (concern.includes('worried')) {
          result.overlyWorried = true;
        }
        // Add more mappings as needed
      });
    }
    
    return result;
  }

  function processReferralPersonalConcerns(personalConcerns) {
    if (!personalConcerns) return {};
    
    // Create a structure that matches the counselingForms personal format
    const result = {
      disorder: typeof personalConcerns === 'string' ? personalConcerns : ''
    };
    
    // If personalConcerns is an array, process it
    if (Array.isArray(personalConcerns)) {
      personalConcerns.forEach(concern => {
        // Map common personal concerns
        if (concern.includes('confidence') || concern.includes('self-esteem')) {
          result.confident = true;
        }
        if (concern.includes('stress')) {
          result.stress = true;
        }
        if (concern.includes('decision')) {
          result.decision = true;
        }
        // Add more mappings as needed
      });
    }
    
    return result;
  }

  export const getReferralsFromCounselingForms = async () => {
    try {
      // Check admin status
      const isAdmin = localStorage.getItem('userRole') === 'admin' && 
                    localStorage.getItem('userEmail') === 'admin@gmail.com';
      
      if (!isAdmin) {
        return { 
          success: false, 
          error: "Unauthorized access. Only administrators can view referrals."
        };
      }
      
      // Query counselingForms for documents where isReferral is true
      const q = query(
        collection(db, "counselingForms"),
        where("isReferral", "==", true)
      );
      
      const querySnapshot = await getDocs(q);
      
      const referrals = [];
      querySnapshot.forEach((doc) => {
        referrals.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`Successfully fetched ${referrals.length} referrals from counselingForms`);
      return { success: true, referrals };
    } catch (error) {
      console.error('Error getting referrals:', error);
      return { success: false, error: error.message };
    }
  };

  const openReferralModal = (student) => {
    console.log("Opening referral modal with data:", student);
    
    // If this is a direct referral from the referrals collection, pass it directly
    if (student.isDirectReferral) {
      setSelectedReferral(student);
      setIsReferralModalOpen(true);
      return;
    }
    
    // Format the referral data to ensure it has all the expected fields
    const formattedReferral = {
      id: student.id,
      clientName: student.name || student.details?.fullName || student.clientName || 'Unknown',
      courseYear: student.course ? `${student.course} ${student.year}` : (student.details?.courseYear || 'Unknown'),
      date: student.details?.date || 'Unknown',
      time: student.details?.time || 'Unknown',
      referredBy: student.referral || student.details?.referredBy || 'Unknown',
      remarks: student.remarks || student.details?.referralRemarks || '',
      otherConcerns: student.otherConcerns || '',
      
      // Format academic concerns
      academicConcerns: Array.isArray(student.details?.academics) 
        ? student.details.academics 
        : (Array.isArray(student.academicConcerns) 
          ? student.academicConcerns 
          : ['None']),
      
      // Format personal concerns
      personalConcerns: Array.isArray(student.details?.personal) 
        ? student.details.personal 
        : (Array.isArray(student.personalConcerns) 
          ? student.personalConcerns 
          : ['None']),
    };
    
    console.log("Formatted referral data:", formattedReferral);
    setSelectedReferral(formattedReferral);
    setIsReferralModalOpen(true);
  };

  const fetchDirectReferrals = async () => {
    try {
      const result = await getReferrals();
      if (result.success) {
        console.log("Direct referrals fetched:", result.referrals.length);
        setDirectReferrals(result.referrals);
      } else {
        toast.error("Failed to fetch referrals: " + result.error);
      }
    } catch (error) {
      console.error("Error fetching direct referrals:", error);
      toast.error("Error fetching referrals: " + error.message);
    }
  };

  export const getReferrals = async () => {
    try {
      // Check admin status
      const isAdmin = localStorage.getItem('userRole') === 'admin' && 
                    localStorage.getItem('userEmail') === 'admin@gmail.com';
      
      if (!isAdmin) {
        return { 
          success: false, 
          error: "Unauthorized access. Only administrators can view referrals."
        };
      }
      
      // Get all referrals from the referrals collection
      const referralsSnapshot = await getDocs(collection(db, "referrals"));
      console.log(`Found ${referralsSnapshot.size} referrals in referrals collection`);
      
      const referrals = [];
      
      // Process each referral
      referralsSnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Create a formatted courseYear if it doesn't exist
        if (!data.courseYear && data.college) {
          data.courseYear = `${data.college} - Year ${data.year}${data.section ? ` Section ${data.section}` : ''}`;
        }
        
        referrals.push({
          id: doc.id,
          ...data,
          isDirectReferral: true // Flag to identify this as a direct referral
        });
      });
      
      console.log(`Successfully processed ${referrals.length} referrals`);
      return { success: true, referrals };
    } catch (error) {
      console.error('Error getting referrals:', error);
      return { success: false, error: error.message };
    }
  };