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
    writeBatch
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
      console.log("Fetching regular counseling forms...");
      const querySnapshot = await getDocs(collection(db, "counselingForms"));
      console.log(`Retrieved ${querySnapshot.size} counseling forms from Firebase`);
      
      const forms = [];
      let processedCount = 0;
      let skippedCount = 0;
      
      querySnapshot.forEach((doc) => {
        try {
          const data = doc.data();
          
          // Skip completed forms
          if (data.status === 'Completed') {
            console.log(`Skipping completed form ${doc.id}`);
            skippedCount++;
            return;
          }
          
          // Skip forms that are marked as referrals - these will be handled by getReferrals
          if (data.isReferral === true) {
            console.log(`Skipping referral form ${doc.id} (will be handled by getReferrals)`);
            skippedCount++;
            return;
          }
          
          // Process the regular counseling form
          const formattedForm = {
            id: doc.id,
            name: data.fullName || data.clientName || data.studentName || data.name || 'Unknown',
            course: data.college || data.course || 'Unknown',
            year: data.year ? `Year ${data.year}${data.section ? ` Section ${data.section}` : ''}` : 'Unknown',
            type: data.selectedMode || data.type || 'Walk-in',
            referral: 'Self',
            remarks: data.remarks || '',
            status: data.status || 'Pending',
            isReferral: false,
            dateTime: data.submissionDate || data.createdAt || new Date().toISOString(),
            
            // Add the original data structures
            academics: data.academics || {},
            personal: data.personal || {},
            family: data.family || {},
            interpersonal: data.interpersonal || {},
            griefBereavement: data.griefBereavement || {},
            gettingToKnowYou: data.gettingToKnowYou || {},
          
            // Keep the details object for backward compatibility
            details: {
              fullName: data.fullName || data.clientName || data.studentName || data.name || 'Unknown',
              email: data.email || 'Unknown',
              courseYear: `${data.college || 'Unknown'} - ${data.year ? `Year ${data.year}${data.section ? ` Section ${data.section}` : ''}` : 'Unknown'}`,
              department: data.college || 'Unknown Department',
              id: data.uicId || 'Unknown',
              dob: data.dob || 'Unknown',
              ageSex: data.age && data.sex ? `${data.age} / ${data.sex}` : (data.sex ? `Unknown / ${data.sex}` : 'Unknown / Unknown'),
              contact: data.contact || data.contactNo || 'Unknown',
              address: data.address || 'Unknown',
              emergencyContact: data.emergencyContact ? 
                               `${data.emergencyContact} - ${data.emergencyContactNo || 'Unknown'}` : 
                               (data.emergencyContactPerson ? 
                                `${data.emergencyContactPerson} - ${data.emergencyContactNo || 'Unknown'}` : 
                                'Unknown - Unknown'),
              date: data.selectedDate || 'Unknown',
              time: data.selectedTime || 'Unknown',
              mode: 'Non-Referral',
              
              // Initialize concern arrays
              personal: [],
              academics: [],
              family: [],
              interpersonal: [],
              grief: [],
              otherConcerns: data.otherConcerns || '',
            }
          };
          
          // Extract concerns based on your screenshot structure
          // Personal concerns
          if (data.suicide === true) formattedForm.details.personal.push('Suicidal thoughts');
          if (data.worry === true) formattedForm.details.personal.push('Excessive worry');
          if (data.time === true) formattedForm.details.personal.push('Time management issues');
          if (data.usage && data.usage !== "") formattedForm.details.personal.push(`Usage concerns: ${data.usage}`);
          
          // If no concerns were added, set to 'None'
          if (formattedForm.details.personal.length === 0) formattedForm.details.personal = ['None'];
          if (formattedForm.details.academics.length === 0) formattedForm.details.academics = ['None'];
          if (formattedForm.details.family.length === 0) formattedForm.details.family = ['None'];
          if (formattedForm.details.interpersonal.length === 0) formattedForm.details.interpersonal = ['None'];
          if (formattedForm.details.grief.length === 0) formattedForm.details.grief = ['None'];
          
          forms.push(formattedForm);
          processedCount++;
          console.log(`Successfully processed regular form ${doc.id}`);
        } catch (processError) {
          console.error(`Error processing document ${doc.id}:`, processError);
        }
      });
      
      console.log(`Processing summary: ${processedCount} regular forms processed, ${skippedCount} forms skipped`);
      
      return { success: true, forms };
    } catch (error) {
      console.error('Error getting active forms:', error);
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

  export const updateFormStatus = async (formId, status, remarks = '', additionalData = {}) => {
    try {
      console.log(`Updating form ${formId} to status: ${status}, remarks: ${remarks}`);
      
      // Try referrals collection first for referrals
      let formRef = doc(db, "referrals", formId);
      let formDoc = await getDoc(formRef);
      let isReferralCollection = true;
      
      // If not found in referrals, try counselingForms collection
      if (!formDoc.exists()) {
        formRef = doc(db, "counselingForms", formId);
        formDoc = await getDoc(formRef);
        isReferralCollection = false;
        
        if (!formDoc.exists()) {
          console.error("Form not found in any collection:", formId);
          return { success: false, error: "Form not found in any collection" };
        }
      }
      
      console.log(`Found form in ${isReferralCollection ? 'referrals' : 'counselingForms'} collection`);
      
      // Prepare update data
      const updateData = {
        status,
        updatedAt: new Date().toISOString()
      };
      
      // Always include remarks if provided (don't make this conditional)
      if (remarks) updateData.remarks = remarks;
      
      // Add all additional data
      Object.assign(updateData, additionalData);
      
      console.log("Updating with data:", updateData);
      
      // Update the document
      await updateDoc(formRef, updateData);
      console.log("Document updated successfully");
      
      // If completing the session, move to history
      if (status === 'Completed') {
        console.log("Moving completed form to history");
        const historyData = {
          ...formDoc.data(),
          ...updateData,
          originalId: formId,
          originalCollection: isReferralCollection ? 'referrals' : 'counselingForms',
          movedToHistoryAt: new Date().toISOString()
        };
        
        await addDoc(collection(db, "counselingHistory"), historyData);
        await deleteDoc(formRef);
        console.log("Form moved to history successfully");
      }
      
      return { 
        success: true,
        updatedData: updateData,
        isReferral: isReferralCollection
      };
    } catch (error) {
      console.error("Error updating form status:", error);
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
      console.log("Fetching completed interview forms from history collection...");
      
      // Check admin status
      const isAdmin = localStorage.getItem('userRole') === 'admin' && 
                    localStorage.getItem('userEmail') === 'admin@gmail.com';
      
      if (!isAdmin) {
        return { 
          success: false, 
          error: "Unauthorized access. Only administrators can view forms."
        };
      }
      
      // Get forms from the counselingHistory collection
      const historyCollection = collection(db, "counselingHistory");
      const querySnapshot = await getDocs(historyCollection);
      
      console.log(`Found ${querySnapshot.size} documents in history collection`);
      
      const forms = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Log each document to see what fields it contains
        console.log("History form:", doc.id, data);
        
        forms.push({
          id: doc.id,
          ...data
        });
      });
      
      console.log(`Successfully fetched ${forms.length} completed forms from history`);
      return { success: true, forms };
    } catch (error) {
      console.error('Error getting completed interview forms:', error);
      return { success: false, error: error.message };
    }
  };

  

  // Helper functions to process referral concerns

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
      
      console.log("Fetching referrals from both collections...");
      
      // Get referrals from both collections concurrently
      const [directReferralsSnapshot, referralFormsSnapshot] = await Promise.all([
        getDocs(collection(db, "referrals")),
        getDocs(query(collection(db, "counselingForms"), where("isReferral", "==", true)))
      ]);
      
      console.log(`Found ${directReferralsSnapshot.size} direct referrals in referrals collection`);
      console.log(`Found ${referralFormsSnapshot.size} referral forms in counselingForms collection`);
      
      const referrals = [];
      
      // Process direct referrals from referrals collection
      directReferralsSnapshot.forEach((doc) => {
        try {
          const data = doc.data();
          console.log(`Processing direct referral ${doc.id}:`, data);
          
          // Skip completed referrals if needed
          if (data.status === 'Completed') {
            return;
          }
          
          // Extract course and year information with better handling
          const college = data.college || '';
          
          // Format courseYear with better extraction
          let courseYear = '';
          if (data.courseYear) {
            courseYear = data.courseYear;
          } else if (data.college) {
            if (data.year) {
              courseYear = `${data.college} - Year ${data.year}${data.section ? ` Section ${data.section}` : ''}`;
            } else {
              courseYear = data.college;
            }
          }
          
          // Extract year display value from courseYear or year/section fields
          let yearDisplay = '';
          if (data.courseYear) {
            // Try to extract year from courseYear string like "College of X - Year 3 Section A"
            const yearMatch = data.courseYear.match(/Year\s+(\d+)(?:\s+Section\s+([A-Z]))?/i);
            if (yearMatch) {
              yearDisplay = `Year ${yearMatch[1]}${yearMatch[2] ? ` Section ${yearMatch[2]}` : ''}`;
            } else if (data.courseYear.includes('-')) {
              // Try to extract from format with dash
              const parts = data.courseYear.split('-');
              if (parts.length > 1) {
                yearDisplay = parts[1].trim();
              } else {
                yearDisplay = data.courseYear;
              }
            } else {
              yearDisplay = data.courseYear;
            }
          } else if (data.year) {
            yearDisplay = `Year ${data.year}${data.section ? ` Section ${data.section}` : ''}`;
          }
          
          // Fix appointment date/time
          const appointmentDate = data.date || '';
          const appointmentTime = data.time || '';
          
          // Create the formatted referral object
          const formattedReferral = {
            id: doc.id,
            name: data.clientName || '',
            course: college,
            year: yearDisplay,
            type: 'Referral',
            referral: data.referredBy || 'Faculty',
            remarks: data.remarks || '',
            status: data.status || 'Pending',
            isReferral: true,
            isDirectReferral: true,
            dateTime: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
            
            // Include original data for debugging
            originalData: data,
            
            // Specific fields for the UI
            courseYear: courseYear,
            date: appointmentDate,
            time: appointmentTime,
            academicConcerns: Array.isArray(data.academicConcerns) ? data.academicConcerns : [],
            personalConcerns: Array.isArray(data.personalConcerns) ? data.personalConcerns : [],
            otherConcerns: data.otherConcerns || '',
          };
          
          referrals.push(formattedReferral);
          console.log(`Successfully processed direct referral ${doc.id}`);
        } catch (error) {
          console.error(`Error processing direct referral ${doc.id}:`, error);
        }
      });
      
      // Process referral forms from counselingForms collection
      referralFormsSnapshot.forEach((doc) => {
        try {
          const data = doc.data();
          console.log(`Processing referral form ${doc.id}:`, data);
          
          // Skip completed referrals
          if (data.status === 'Completed') {
            return;
          }
          
          const formattedReferral = {
            id: doc.id,
            name: data.fullName || data.clientName || data.studentName || '',
            course: data.college || '',
            year: data.year ? `Year ${data.year}${data.section ? ` Section ${data.section}` : ''}` : '',
            type: 'Referral',
            referral: data.referredBy || 'Faculty',
            remarks: data.remarks || '',
            status: data.status || 'Pending',
            isReferral: true,
            isDirectReferral: false, // This is from counselingForms, not a direct referral
            dateTime: data.submissionDate || data.createdAt || new Date().toISOString(),
            
            // Include original data for debugging
            originalData: data,
            
            // Specific fields for the UI
            courseYear: data.college ? `${data.college} - Year ${data.year || ''}${data.section ? ` Section ${data.section}` : ''}` : '',
            date: data.selectedDate || data.date || '',
            time: data.selectedTime || data.time || '',
            academicConcerns: data.concerns?.academic || [],
            personalConcerns: data.concerns?.personal || [],
            otherConcerns: data.concerns?.other || data.otherConcerns || '',
          };
          
          referrals.push(formattedReferral);
          console.log(`Successfully processed referral form ${doc.id}`);
        } catch (error) {
          console.error(`Error processing referral form ${doc.id}:`, error);
        }
      });
      
      console.log(`Successfully processed ${referrals.length} total referrals`);
      return { success: true, referrals };
    } catch (error) {
      console.error('Error getting referrals:', error);
      return { success: false, error: error.message };
    }
  };