import React, { useState, useEffect } from 'react';
import AdminNavbar from '../ui/adminnavbar';
import {
  getStudentInterviewForms,
  getUnavailableDates,
  setUnavailableDates,
  removeUnavailableDates,
  getReferrals  // Add this import
} from '../../firebase/firestoreService';
import UnavailableDatesModal from '../ui/UnavailableDatesModal.jsx';
import {
  addMonths,
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  getDay,
  isSameDay,
  parseISO,
} from 'date-fns';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Schedule() {
  const [date, setDate] = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [allSessions, setAllSessions] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [selectedUnavailableDates, setSelectedUnavailableDates] = useState([]);
  const [unavailableReason, setUnavailableReason] = useState('');
  const [unavailableMode, setUnavailableMode] = useState('add'); // 'add' or 'remove'
  const [processingUnavailable, setProcessingUnavailable] = useState(false);
  const [renderKey, setRenderKey] = useState(0); // Used to force re-renders
  
  const isValidDate = (date) => {
    return date instanceof Date && !isNaN(date.getTime());
  };

  const formattedDate = format(date, "EEEE, MMMM d, yyyy");

  useEffect(() => {
    fetchSessions();
    fetchUnavailableDates();
  }, []);

  useEffect(() => {
    if (allSessions.length > 0) {
      filterSessionsByDate(date);
    }
  }, [date, allSessions]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both regular forms and referrals concurrently
      const [regularFormsResult, referralsResult] = await Promise.all([
        getStudentInterviewForms(),
        getReferrals()
      ]);
      
      // Initialize array for processed sessions
      const processedSessions = [];
      
      // Process regular forms
      if (regularFormsResult.success) {
        const forms = regularFormsResult.forms || [];
        console.log(`Processing ${forms.length} regular forms`);
        
        for (const form of forms) {
          try {
            // Extract name with fallbacks
            const name = form.fullName || form.clientName || form.studentName || form.name || 'Unknown';
            
            // Extract college/department with fallbacks
            const college = form.college || form.department || '';
            
            // Extract year and section with proper formatting
            let yearSection = '';
            if (form.year) {
              yearSection = `Year ${form.year}${form.section ? ` Section ${form.section}` : ''}`;
            } else if (form.courseYearSection) {
              // Try to extract year from courseYearSection
              const match = form.courseYearSection.match(/Year\s+(\d+)(?:\s+Section\s+([A-Z]))?/i);
              if (match) {
                yearSection = `Year ${match[1]}${match[2] ? ` Section ${match[2]}` : ''}`;
              } else if (form.courseYearSection.includes('-')) {
                // Try to extract from format like "BSCS - Year 2"
                const parts = form.courseYearSection.split('-');
                if (parts.length > 1) {
                  yearSection = parts[1].trim();
                }
              }
            }
            
            // Determine the appropriate appointment date with validation
            let appointmentDate = null;
            if (form.remarks === 'Follow up' && form.followUpDate) {
              appointmentDate = new Date(form.followUpDate);
            } else if (form.appointmentDate) {
              appointmentDate = new Date(form.appointmentDate);
            } else if (form.scheduledDate) {
              appointmentDate = new Date(form.scheduledDate);
            } else if (form.selectedDate) {
              appointmentDate = new Date(form.selectedDate);
            } else if (form.dateTime) {
              appointmentDate = new Date(form.dateTime);
            } else if (form.submissionDate) {
              appointmentDate = new Date(form.submissionDate);
            } else if (form.date) {
              appointmentDate = new Date(form.date);
            }
            
            // Validate the date is valid
            if (!appointmentDate || isNaN(appointmentDate.getTime())) {
              console.log(`Skipping regular form ${form.id} - invalid or missing date`);
              continue; // Skip this form
            }
            
            // Determine the appropriate appointment time
            let appointmentTime = '';
            if (form.remarks === 'Follow up' && form.followUpTime) {
              appointmentTime = form.followUpTime;
            } else if (form.scheduledTime) {
              appointmentTime = form.scheduledTime;
            } else if (form.selectedTime) {
              appointmentTime = form.selectedTime;
            } else if (form.time) {
              appointmentTime = form.time;
            } else if (form.dateTime) {
              try {
                appointmentTime = format(new Date(form.dateTime), 'h:mm a');
              } catch (e) {
                console.error("Error formatting dateTime:", e);
              }
            }
            
            // Add the processed session
            processedSessions.push({
              id: form.id,
              ...form,
              name,
              college,
              yearSection,
              appointmentDate,
              appointmentTime,
              isReferral: form.isReferral === true,
              status: form.status || 'Pending',
              remarks: form.remarks || '',
              type: form.selectedMode || form.type || 'Walk-in'
            });
            
            console.log(`Processed regular form: ${form.id}, date: ${appointmentDate.toISOString()}`);
          } catch (processError) {
            console.error("Error processing regular form:", processError, form);
          }
        }
        
        console.log(`Successfully processed ${processedSessions.length} regular forms`);
      } else {
        console.error("Failed to fetch regular forms:", regularFormsResult.error);
      }
      
      // Process referrals
      if (referralsResult && referralsResult.success) {
        const referrals = referralsResult.referrals || [];
        console.log(`Processing ${referrals.length} referrals`);
        
        for (const referral of referrals) {
          try {
            // Skip completed referrals
            if (referral.status === 'Completed') {
              console.log(`Skipping completed referral: ${referral.id}`);
              continue;
            }
            
            // Extract name with fallbacks
            const name = referral.name || referral.clientName || 'Unknown';
            
            // Extract college/department with fallbacks
            const college = referral.course || referral.college || '';
            
            // Extract year and section
            const yearSection = referral.year || '';
            
            // Process appointment date for referrals
            let appointmentDate = null;
            
            // Try different date fields that might be in the referral
            if (referral.date) {
              appointmentDate = new Date(referral.date);
            } else if (referral.appointmentDate) {
              appointmentDate = new Date(referral.appointmentDate);
            } else if (referral.scheduledDate) {
              appointmentDate = new Date(referral.scheduledDate);
            } else if (referral.selectedDate) {
              appointmentDate = new Date(referral.selectedDate);
            } else if (referral.dateTime) {
              appointmentDate = new Date(referral.dateTime);
            }
            
            // Validate the date
            if (!appointmentDate || isNaN(appointmentDate.getTime())) {
              console.log(`Skipping referral ${referral.id} - invalid or missing date`);
              continue;
            }
            
            // Get appointment time
            let appointmentTime = '';
            if (referral.time) {
              appointmentTime = referral.time;
            } else if (referral.appointmentTime) {
              appointmentTime = referral.appointmentTime;
            } else if (referral.scheduledTime) {
              appointmentTime = referral.scheduledTime;
            } else if (referral.selectedTime) {
              appointmentTime = referral.selectedTime;
            }
            
            // Add to processed sessions
            processedSessions.push({
              id: referral.id,
              ...referral,
              name,
              college,
              yearSection,
              appointmentDate,
              appointmentTime,
              isReferral: true,
              status: referral.status || 'Pending',
              remarks: referral.remarks || '',
              type: 'Referral',
              referral: referral.referral || referral.referredBy || 'Faculty'
            });
            
            console.log(`Processed referral: ${referral.id}, date: ${appointmentDate.toISOString()}`);
          } catch (processError) {
            console.error("Error processing referral:", processError, referral);
          }
        }
        
        console.log(`Total sessions after adding referrals: ${processedSessions.length}`);
      } else {
        console.error("Failed to fetch referrals:", referralsResult?.error || "Unknown error");
      }
      
      console.log("Final processed sessions:", processedSessions);
      setAllSessions(processedSessions);
      
      // Initially filter by current date
      filterSessionsByDate(date);
      
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setError("Failed to load sessions: " + error.message);
      toast.error("Failed to load sessions: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnavailableDates = async () => {
    try {
      const result = await getUnavailableDates();
      console.log("getUnavailableDates result:", result);
      
      if (result && result.success && Array.isArray(result.dates)) {
        // Convert string dates to Date objects
        const dateObjects = result.dates.map(item => {
          try {
            if (!item || !item.date) return null;
            
            return {
              date: new Date(item.date),
              reason: item.reason || ""
            };
          } catch (err) {
            console.warn("Error parsing date:", err);
            return null;
          }
        }).filter(item => item !== null && isValidDate(item.date));
        
        setUnavailableDates(dateObjects);
      } else {
        console.error("Failed to fetch unavailable dates:", result?.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error in fetchUnavailableDates:", error);
    }
  };

  const formatSafely = (date, formatString) => {
    try {
      if (!isValidDate(date)) {
        console.warn("Invalid date passed to formatSafely:", date);
        return "Invalid Date";
      }
      return format(date, formatString);
    } catch (error) {
      console.error("Error formatting date:", error, "date:", date, "format:", formatString);
      return "Format Error";
    }
  };
  
  // Improved isDateUnavailable function
  const isDateUnavailable = (day) => {
    if (!day || !isValidDate(day)) return false;
    if (!Array.isArray(unavailableDates) || unavailableDates.length === 0) return false;
    
    return unavailableDates.some(item => {
      if (!item || !item.date || !isValidDate(item.date)) return false;
      return isSameDay(item.date, day);
    });
  };

  const handleMarkUnavailable = async () => {
    if (selectedUnavailableDates.length === 0) {
      toast.warning("Please select at least one date");
      return;
    }

    setProcessingUnavailable(true);
    try {
      // Make sure setUnavailableDates is properly imported
      if (typeof setUnavailableDates !== 'function') {
        console.error("setUnavailableDates is not a function. Check your imports.");
        toast.error("System error: Function not available");
        return;
      }
      
      // Safely format dates
      const dateStrings = [];
      for (const date of selectedUnavailableDates) {
        try {
          if (!isValidDate(date)) continue;
          dateStrings.push(formatSafely(date, 'yyyy-MM-dd'));
        } catch (err) {
          console.warn("Error formatting date:", err);
        }
      }
      
      if (dateStrings.length === 0) {
        toast.error("No valid dates selected");
        return;
      }
      
      console.log("Calling setUnavailableDates with:", dateStrings, unavailableReason);
      const result = await setUnavailableDates(dateStrings, unavailableReason);
      console.log("setUnavailableDates result:", result); // Debug log
      
      if (!result) {
        console.error("setUnavailableDates returned undefined");
        toast.error("An error occurred. Please check the console for details.");
        return;
      }
      
      if (result.success) {
        toast.success(result.message || "Dates marked as unavailable");
        setSelectedUnavailableDates([]);
        setUnavailableReason('');
        fetchUnavailableDates(); // Refresh the list
        setShowUnavailableModal(false);
      } else {
        toast.error(result.error || "Failed to mark dates as unavailable");
      }
    } catch (error) {
      console.error("Error marking dates as unavailable:", error);
      toast.error("An error occurred: " + error.message);
    } finally {
      setProcessingUnavailable(false);
    }
  };

  // Add this function to your component
const formatTimeForDisplay = (time) => {
  if (!time) return "Time not specified";
  
  // If it's already in a reasonable format (like "2:00 PM"), return it
  if (/^\d{1,2}:\d{2}(?: [AP]M)?$/i.test(time)) {
    return time;
  }
  
  // Try to parse and format if it's a 24-hour time
  if (/^\d{1,2}:\d{2}$/.test(time)) {
    try {
      // Create a dummy date with the time
      const dummyDate = new Date();
      const [hours, minutes] = time.split(':').map(Number);
      dummyDate.setHours(hours, minutes);
      return format(dummyDate, 'h:mm a');
    } catch (e) {
      console.error("Error formatting time:", e, time);
      return time; // Return original if parsing fails
    }
  }
  
  return time;
};

// Helper function to format dates consistently
const formatDateForDisplay = (date, formatString = 'MMMM d, yyyy') => {
  if (!date || !isValidDate(date)) return 'Unknown';
  
  try {
    return format(date, formatString);
  } catch (error) {
    console.error("Error formatting date for display:", error, date);
    return 'Invalid Date';
  }
};

// Helper function to safely parse dates from various formats
const parseDateSafely = (dateValue) => {
  if (!dateValue) return null;
  
  try {
    const parsedDate = new Date(dateValue);
    return isValidDate(parsedDate) ? parsedDate : null;
  } catch (error) {
    console.error("Error parsing date:", error, dateValue);
    return null;
  }
};

  const handleRemoveUnavailable = async () => {
    if (selectedUnavailableDates.length === 0) {
      toast.warning("Please select at least one date to remove");
      return;
    }

    setProcessingUnavailable(true);
    try {
      // Convert Date objects to YYYY-MM-DD format
      const dateStrings = selectedUnavailableDates.map(date => 
        format(date, 'yyyy-MM-dd')
      );
      
      const result = await removeUnavailableDates(dateStrings);
      
      if (result.success) {
        toast.success(result.message);
        setSelectedUnavailableDates([]);
        fetchUnavailableDates(); // Refresh the list
        setShowUnavailableModal(false);
      } else {
        toast.error(`Failed to remove unavailable dates: ${result.error}`);
      }
    } catch (error) {
      console.error("Error removing unavailable dates:", error);
      toast.error("An error occurred while removing unavailable dates");
    } finally {
      setProcessingUnavailable(false);
    }
  };

  // Improved filterSessionsByDate function
  const filterSessionsByDate = (selectedDate) => {
    if (!selectedDate || !isValidDate(selectedDate)) {
      console.error("Invalid date provided to filterSessionsByDate:", selectedDate);
      setSessions([]);
      return;
    }
    
    // Format the selected date as YYYY-MM-DD for comparison
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    console.log("Filtering sessions for date:", dateStr);
    
    // Filter sessions for the selected date
    const filteredSessions = allSessions.filter(session => {
      try {
        // Add this safety check
        if (!session || !session.appointmentDate) {
          console.log("Skipping session without appointmentDate:", session?.id || "unknown");
          return false;
        }
        
        if (!isValidDate(session.appointmentDate)) {
          console.log("Skipping session with invalid appointmentDate:", session.id);
          return false;
        }
        
        const sessionDateStr = format(session.appointmentDate, 'yyyy-MM-dd');
        return sessionDateStr === dateStr;
      } catch (error) {
        console.error("Error filtering session:", error, session);
        return false;
      }
    });
    
    console.log(`Found ${filteredSessions.length} sessions for ${dateStr}`);
    setSessions(filteredSessions);
    setSelectedSession(null);
  }

  const handleSessionClick = (session) => {
    setSelectedSession(session);
  };

  // Get session time
  // Get session time
  const getSessionTime = (session) => {
    return formatTimeForDisplay(session.appointmentTime);
  };

  // Get session type label
  const getSessionTypeLabel = (session) => {
    if (session.remarks === 'Follow up') {
      return "Follow-up";
    }
    
    if (session.isReferral) {
      return "Referral";
    }
    
    return session.type || "Walk-in";
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'Confirmed': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'No-show': 
      case 'No Show': return 'bg-orange-100 text-orange-800';
      case 'Rescheduled': return 'bg-purple-100 text-purple-800';
      case 'Follow up': return 'bg-purple-100 text-purple-800';
      default: return 'bg-yellow-100 text-yellow-800'; // Pending
    }
  };

  // Get student name consistently
  const getStudentName = (session) => {
    return session.name || "Student";
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-semibold">
          {format(currentMonth, 'MMMM/yyyy')}
        </span>
        <div className="flex space-x-2">
          <button
            onClick={prevMonth}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ["Wk", "Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    return (
      <div className="grid grid-cols-8 text-center">
        {days.map((day, i) => (
          <div key={i} className="text-sm font-medium py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };
  

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = monthStart;
    const endDate = monthEnd;
    
    const dateFormat = "d";
    const rows = [];
    
    let days = eachDayOfInterval({ start: startDate, end: endDate });
    let startingWeekNumber = Math.ceil(parseInt(format(startDate, 'w')));
    
    // Group days by weeks
    const weeks = days.reduce((acc, day) => {
      const weekNumber = parseInt(format(day, 'w'));
      const weekIndex = weekNumber - startingWeekNumber;
      
      if (!acc[weekIndex]) {
        acc[weekIndex] = [];
      }
      
      acc[weekIndex].push(day);
      return acc;
    }, {});
    
    // Helper function to check if a date has sessions
    // Helper function to check if a date has sessions
    const hasSessionsOnDate = (day) => {
      if (!day || !isValidDate(day)) return false;
      
      return allSessions.some(session => {
        if (!session || !session.appointmentDate || !isValidDate(session.appointmentDate)) {
          return false;
        }
        
        return isSameDay(session.appointmentDate, day);
      });
    };
    
    // Create rows for each week
    Object.values(weeks).forEach((week, weekIndex) => {
      const weekNumber = startingWeekNumber + weekIndex;
      const daysInWeek = [];
      
      // Add week number cell
      daysInWeek.push(
        <div key={`week-${weekIndex}`} className="text-center py-3 text-sm text-gray-500">
          {weekNumber}
        </div>
      );
      
      // Fill in days for the week
      const daysOfWeek = Array(7).fill(null);
      
      week.forEach(day => {
        const dayOfWeek = getDay(day);
        daysOfWeek[dayOfWeek] = day;
      });
      
      daysOfWeek.forEach((day, i) => {
        const formattedDate = day ? format(day, dateFormat) : "";
        const isCurrentMonth = day ? isSameMonth(day, currentMonth) : false;
        const isCurrentDay = day ? isToday(day) : false;
        const isSelected = day ? isSameDay(day, date) : false;
        const isUnavailable = isDateUnavailable(day);
        const hasSession = hasSessionsOnDate(day);
        
        daysInWeek.push(
          <div
            key={i}
            onClick={() => day && setDate(day)}
            className={`text-center py-3 cursor-pointer relative ${
              !isCurrentMonth ? "text-gray-300" : 
              isSelected ? "font-bold" : 
              isCurrentDay ? "text-red-500 font-bold" : 
              isUnavailable ? "text-red-400 line-through" : "text-gray-900"
            }`}
          >
            <span className={`${isSelected ? "bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto" : ""}`}>
              {formattedDate}
            </span>
            
            {/* Session indicator */}
            {hasSession && (
              <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></span>
            )}
            
            {/* Unavailable indicator */}
            {isUnavailable && (
              <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full ml-2"></span>
            )}
          </div>
        );
      });
      
      rows.push(
        <div key={weekIndex} className="grid grid-cols-8">
          {daysInWeek}
        </div>
      );
    });
    
    return <div className="border-t border-l">{rows}</div>;
  };

  return (
    <div className="bg-white min-h-screen" key={renderKey}>
      <AdminNavbar />
      
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <div className="max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Schedule</h1>
          <button
            onClick={() => {
              setShowUnavailableModal(true);
              setSelectedUnavailableDates([]);
              setUnavailableReason('');
              setUnavailableMode('add');
            }}
            className="px-4 py-2 bg-[#3A0323] text-white rounded-md hover:bg-[#2a0114] transition-colors"
          >
            Manage Unavailable Dates
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button 
              onClick={fetchSessions}
              className="underline ml-2"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar Section */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
            <div className="flex items-center mb-4">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2 text-gray-700" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              <h2 className="text-xl font-semibold">Calendar</h2>
            </div>
            <div className="calendar-container">
              {renderHeader()}
              {renderDays()}
              {renderCells()}
            </div>
            
            {/* Calendar Legend */}
            <div className="mt-4 text-xs text-gray-600 flex flex-wrap gap-4">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                <span>Sessions Scheduled</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                <span>Date Unavailable</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] mr-1">
                  {format(new Date(), 'd')}
                </span>
                <span>Selected Date</span>
              </div>
            </div>
          </div>

          {/* Sessions Section */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
            <h2 className="text-xl font-semibold mb-4">
              Sessions for {formattedDate}
            </h2>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">Loading sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">No sessions for this day</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {sessions.map((session) => (
                  <div 
                    key={`${session.id}-${session.status || 'pending'}`} 
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedSession?.id === session.id ? 'border-[#3A0323] bg-pink-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSessionClick(session)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{getStudentName(session)}</h3>
                        <p className="text-sm text-gray-600">
                          {session.college}
                          {session.yearSection && ` - ${session.yearSection}`}
                        </p>
                        <p className="text-sm text-gray-600">{getSessionTime(session)}</p>
                        {session.remarks === 'Follow up' && (
                          <p className="text-sm text-purple-600 font-medium">
                            Follow-up Appointment
                          </p>
                        )}
                        {session.status === 'Rescheduled' && (
                          <p className="text-sm text-purple-600 font-medium">
                            {session.remarks?.includes('Rescheduled to') ? session.remarks : 'Rescheduled'}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusClass(session.remarks || session.status || 'Pending')}`}>
                          {session.remarks === 'Follow up' ? 'Follow up' : (session.status || 'Pending')}
                        </span>
                        <span className="text-xs mt-1">
                          {getSessionTypeLabel(session)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {selectedSession && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold mb-3">Session Details</h3>
                <div className="mt-2 text-sm space-y-2">
                  <p><strong>Student:</strong> {getStudentName(selectedSession)}</p>
                  
                  <p><strong>College Department & Course & Year:</strong> {
                    (() => {
                      let collegeDept = "";
                      
                      // Try to get college from direct field
                      if (selectedSession.college) {
                        // If it's already a full college name (contains "College of")
                        if (selectedSession.college.toLowerCase().includes("college of")) {
                          collegeDept = selectedSession.college;
                        } else {
                          // Try to map to full college name
                          collegeDept = getDepartmentFromCourse(selectedSession.college);
                        }
                      } 
                      // Try to extract from courseYearSection
                      else if (selectedSession.courseYearSection) {
                        const parts = selectedSession.courseYearSection.split(' ');
                        if (parts.length > 0) {
                          collegeDept = getDepartmentFromCourse(parts[0]);
                        }
                      }
                      
                      if (!collegeDept || collegeDept === "Unknown College") {
                        collegeDept = "Unknown College";
                      }
                      
                      // Now add year and section if available
                      let yearSection = "";
                      if (selectedSession.yearSection) {
                        yearSection = ` - ${selectedSession.yearSection}`;
                      }
                      
                      return collegeDept + yearSection;
                    })()
                  }</p>
                  
                  <p><strong>Contact:</strong> {selectedSession.contactNo || selectedSession.contact || selectedSession.email || 'N/A'}</p>
                  
                  <p><strong>Appointment Date:</strong> {
                    selectedSession.appointmentDate ? 
                      formatDateForDisplay(selectedSession.appointmentDate) : 
                      'N/A'
                  }</p>

                  <p><strong>Time:</strong> {getSessionTime(selectedSession)}</p>

                  {selectedSession.followUpDate && (
                    <p><strong>Follow-up Date:</strong> {
                      formatDateForDisplay(new Date(selectedSession.followUpDate))
                    }
                      {selectedSession.followUpTime && ` at ${formatTimeForDisplay(selectedSession.followUpTime)}`}
                    </p>
                  )}
                  
                  {selectedSession.sessionNotes && (
                    <p><strong>Session Notes:</strong> {selectedSession.sessionNotes}</p>
                  )}
                  
                  {selectedSession.isReferral && (
                    <p><strong>Referred by:</strong> {selectedSession.referredBy || selectedSession.referral || 'N/A'}</p>
                  )}
                  
                  {selectedSession.remarks && selectedSession.remarks !== 'Follow up' && (
                    <p><strong>Remarks:</strong> {selectedSession.remarks}</p>
                  )}
                  
                  <div className="mt-4 text-gray-500 text-xs italic">
                    <p>* To update session status, please go to the Submissions page</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <UnavailableDatesModal
        showModal={showUnavailableModal}
        onClose={() => setShowUnavailableModal(false)}
        unavailableDates={unavailableDates}
        onDatesUpdated={fetchUnavailableDates}
        isValidDate={isValidDate}
      />
    </div>
  );
}

// Helper function to determine department from course code
function getDepartmentFromCourse(courseCode) {
  if (!courseCode) return 'Unknown College';
  
  const programCode = courseCode.split(' ')[0];
  
  const collegeMap = {
    'BSA': 'College of Accounting and Business Education',
    'BSMA': 'College of Accounting and Business Education',
    'BSAIS': 'College of Accounting and Business Education',
    'BSBA': 'College of Accounting and Business Education',
    'BSREM': 'College of Accounting and Business Education',
    'AB': 'College of Arts and Humanities',
    'ABCOM': 'College of Arts and Humanities',
    'ABELS': 'College of Arts and Humanities',
    'ABPhilo': 'College of Arts and Humanities',
    'ABPsych': 'College of Arts and Humanities',
    'BSCS': 'College of Computer Studies',
    'BSIS': 'College of Computer Studies',
    'BSIT': 'College of Computer Studies',
    'BSArch': 'College of Engineering and Architecture',
    'BSCE': 'College of Engineering and Architecture',
    'BSCpE': 'College of Engineering and Architecture',
    'BSECE': 'College of Engineering and Architecture',
    'BSND': 'College of Human Environmental Sciences and Food Studies',
    'BSHRM': 'College of Human Environmental Sciences and Food Studies',
    'BSTM': 'College of Human Environmental Sciences and Food Studies',
    'BSBio': 'College of Medical and Biological Science',
    'BSMLS': 'College of Medical and Biological Science',
    'BM': 'College of Music',
    'BSN': 'College of Nursing',
    'BSP': 'College of Pharmacy and Chemistry',
    'BSChem': 'College of Pharmacy and Chemistry',
    'BECE': 'College of Teacher Education',
    'BEEd': 'College of Teacher Education',
    'BSEd': 'College of Teacher Education',
    'BSNE': 'College of Teacher Education',
    'BPE': 'College of Teacher Education',
  };

  if (collegeMap[programCode]) {
    return collegeMap[programCode];
  }
  
  for (const prefix in collegeMap) {
    if (programCode.startsWith(prefix)) {
      return collegeMap[prefix];
    }
  }

  if (programCode.includes('BA') || programCode.includes('Acct') || programCode.includes('Fin') || 
      programCode.includes('Mgt') || programCode.includes('HRM')) {
    return 'College of Accounting and Business Education';
  } else if (programCode.includes('Arch') || programCode.includes('CE') || 
            programCode.includes('CpE') || programCode.includes('ECE')) {
    return 'College of Engineering and Architecture';
  } else if (programCode.includes('Ed') || programCode.includes('Edu') || programCode.includes('Teach')) {
    return 'College of Teacher Education';
  } else if (programCode.includes('CS') || programCode.includes('IS') || programCode.includes('IT')) {
    return 'College of Computer Studies';
  } else if (programCode.includes('Nurs')) {
    return 'College of Nursing';
  } else if (programCode.includes('Pharm') || programCode.includes('Chem')) {
    return 'College of Pharmacy and Chemistry';
  } else if (programCode.includes('Bio') || programCode.includes('MLS') || programCode.includes('Lab')) {
    return 'College of Medical and Biological Science';
  } else if (programCode.includes('ND') || programCode.includes('HRM') || programCode.includes('TM')) {
    return 'College of Human Environmental Sciences and Food Studies';
  } else if (programCode.includes('AB') || programCode.includes('Arts') || 
            programCode.includes('Com') || programCode.includes('Psych') || 
            programCode.includes('Phil')) {
    return 'College of Arts and Humanities';
  } else if (programCode.includes('Mus') || programCode.includes('BM')) {
    return 'College of Music';
  }

  return 'Unknown College';
}

export default Schedule;