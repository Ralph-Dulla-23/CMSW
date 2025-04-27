import React, { useState, useEffect, useMemo } from 'react';
import AdminNavbar from '../ui/adminnavbar';
import { Chart } from 'primereact/chart';
import { 
  getStudentInterviewForms, 
  getReferrals,
  getCompletedInterviewForms 
} from '../../firebase/firestoreService';
import { format, isAfter, startOfMonth, startOfWeek, subDays, parseISO, isValid } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// Create a cache object outside the component to persist data between renders
const dashboardCache = {
  data: null,
  lastFetched: null,
  expiryTime: 5 * 60 * 1000 // 5 minutes in milliseconds
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [studentsPerCollegeData, setStudentsPerCollegeData] = useState({});
  const [sessionTypesData, setSessionTypesData] = useState({});
  const [chartOptions, setChartOptions] = useState({});
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    newRequests: 0,
    completedSessions: 0,
    noShows: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define chart colors
  const chartColors = useMemo(() => ({
    backgroundColor: [
      'rgba(239, 68, 68, 0.4)',
      'rgba(59, 130, 246, 0.4)',
      'rgba(16, 185, 129, 0.4)',
      'rgba(245, 158, 11, 0.4)',
      'rgba(139, 92, 246, 0.4)',
      'rgba(236, 72, 153, 0.4)',
      'rgba(75, 85, 99, 0.4)',
      'rgba(251, 146, 60, 0.4)',
      'rgba(52, 211, 153, 0.4)',
      'rgba(99, 102, 241, 0.4)',
      'rgba(209, 213, 219, 0.4)',
    ],
    borderColor: [
      'rgb(239, 68, 68)',
      'rgb(59, 130, 246)',
      'rgb(16, 185, 129)',
      'rgb(245, 158, 11)',
      'rgb(139, 92, 246)',
      'rgb(236, 72, 153)',
      'rgb(75, 85, 99)',
      'rgb(251, 146, 60)',
      'rgb(52, 211, 153)',
      'rgb(99, 102, 241)',
      'rgb(209, 213, 219)',
    ]
  }), []);

  // Helper function to determine department from course code
  const getDepartmentFromCourse = (courseCode) => {
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
  };

  // Helper function to safely parse dates
  const parseDateSafely = (dateValue) => {
    if (!dateValue) return null;
    
    try {
      let date;
      if (dateValue instanceof Date) {
        date = dateValue;
      } else if (typeof dateValue === 'object' && dateValue.toDate) {
        // Handle Firestore Timestamp
        date = dateValue.toDate();
      } else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else {
        return null;
      }
      
      // Check if date is valid
      return isValid(date) ? date : null;
    } catch (error) {
      console.error("Error parsing date:", error, dateValue);
      return null;
    }
  };

  // Helper function to format date with fallback
  const formatDate = (dateValue) => {
    if (!dateValue) return 'Date not specified';
    
    const date = parseDateSafely(dateValue);
    if (!date) return 'Invalid date';
    
    try {
      return format(date, 'MMMM do, yyyy'); // Format as "April 27th, 2025"
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Date format error';
    }
  };

  // Helper function to extract course and year/section from various form formats
  const extractCourseAndYearSection = (form) => {
    // For referrals
    if (form.isReferral && form.course) {
      return {
        course: form.course,
        yearSection: form.year || 'N/A'
      };
    }
    
    // If this is a mobile submission
    if (form.college && form.year) {
      return {
        course: form.college,
        yearSection: `${form.year}${form.section ? form.section : ''}`
      };
    }
    
    // For legacy submissions
    const courseYearSection = form.courseYearSection || '';
    if (!courseYearSection) {
      return { course: 'N/A', yearSection: 'N/A' };
    }
    
    // Try to match common patterns in the courseYearSection string
    const match = courseYearSection.match(/([A-Za-z]+)[\s-]*(\d+[A-Za-z]*)/);
    if (match) {
      return {
        course: match[1].trim(), // The program code (e.g., BSCS)
        yearSection: match[2].trim() // The year and section (e.g., 3A)
      };
    }
    
    // For more complex formats, try to make a best guess
    const parts = courseYearSection.split(/[\s-]+/);
    if (parts.length >= 2) {
      // Assume first part is course code and rest is year/section
      return {
        course: parts[0].trim(),
        yearSection: parts.slice(1).join(' ').trim()
      };
    }
    
    // If we can't parse it, return the original as course
    return {
      course: courseYearSection,
      yearSection: 'N/A'
    };
  };

  // Helper function to extract primary concern
  const getPrimaryConcern = (form) => {
    try {
      // Check if we have the modern structure with academics map
      if (form.academics) {
        if (form.academics.difficultyUnderstanding) return 'difficultyUnderstanding';
        if (form.academics.notPrepared) return 'notMotivatedStudy';
        if (form.academics.overlyWorried) return 'overlyWorriedAcademic';
        if (form.academics.problemBeingOnTime) return 'problemBeingOnTime';
        if (form.academics.notHappyWithCourse) return 'notHappyWithCourse';
        if (form.academics.issueWithTeacher) return 'issueWithTeacher';
        if (form.academics.homesickness) return 'homesickness';
        if (form.academics.academicOthers) return form.academics.academicOthers;
      }
      
      // Check for personal concerns
      if (form.personal) {
        if (form.personal.confident) return 'notConfident';
        if (form.personal.decision) return 'hardTimeDecisions';
        if (form.personal.sleeping) return 'problemSleeping';
        if (form.personal.mood) return 'moodNotStable';
        if (form.personal.stress) return 'stress';
        if (form.personal.emotion) return 'emotionalRegulation';
        if (form.personal.time) return 'timeManagement';
        if (form.personal.worry) return 'excessiveWorry';
        if (form.personal.selfHarm) return 'selfHarm';
        if (form.personal.suicide) return 'suicidalThoughts';
        if (form.personal.disorder) return form.personal.disorder;
      }
      
      // Check if we have areasOfConcern from legacy forms
      if (form.areasOfConcern) {
        const areas = form.areasOfConcern;
        // Check each area type in priority order
        if (areas.academic && areas.academic.length > 0) return areas.academic[0];
        if (areas.personal && areas.personal.length > 0) return areas.personal[0];
        if (areas.interpersonal && areas.interpersonal.length > 0) return areas.interpersonal[0];
        if (areas.family && areas.family.length > 0) return areas.family[0];
      }
      
      // Check referral format
      if (form.academicConcerns && form.academicConcerns.length > 0) {
        return form.academicConcerns[0];
      }
      if (form.personalConcerns && form.personalConcerns.length > 0) {
        return form.personalConcerns[0];
      }
      if (form.concerns) {
        if (form.concerns.academic && form.concerns.academic.length > 0) return form.concerns.academic[0];
        if (form.concerns.personal && form.concerns.personal.length > 0) return form.concerns.personal[0];
      }
      
      // If we have a reason field, use that
      if (form.reason) return form.reason;
      if (form.otherConcerns) return form.otherConcerns;
      
    } catch (error) {
      console.error("Error extracting concern:", error);
    }
    
    return 'General Counseling';
  };

  // Process all forms data to extract necessary information
  const processFormsData = (allForms) => {
    try {
      console.log(`Processing ${allForms.length} total forms`);
      
      // Initialize counters and data structures
      const collegeCounts = {};
      const sessionTypes = {
        'Walk-in': 0,
        'Online': 0,
        'Referral': 0
      };
      
      // Get current date references
      const now = new Date();
      const yesterday = subDays(now, 1);
      const thisWeekStart = startOfWeek(now);
      const thisMonthStart = startOfMonth(now);
      
      // Initialize stats
      let totalStudents = 0;
      let newRequests = 0;
      let completedSessions = 0;
      let noShows = 0;
      
      // Track recent activities
      const recentActivitiesList = [];

      // Process each form
      allForms.forEach((form) => {
        try {
          // Extract basic info
          const studentName = form.name || form.studentName || form.clientName || form.fullName || 'Unknown Student';
          const { course, yearSection } = extractCourseAndYearSection(form);
          
          // Determine college name with fallbacks
          let collegeName;
          if (form.college) {
            collegeName = form.college;
          } else if (form.course) {
            collegeName = getDepartmentFromCourse(form.course);
          } else {
            collegeName = getDepartmentFromCourse(course) || 'Unknown College';
          }
          
          // Parse submission date with various fallback options
          let submissionDate;
          if (form.remarks === 'Follow up' && form.followUpDate) {
            submissionDate = parseDateSafely(form.followUpDate);
          } else if (form.date) {
            submissionDate = parseDateSafely(form.date);
          } else if (form.submissionDate) {
            submissionDate = parseDateSafely(form.submissionDate);
          } else if (form.createdAt) {
            submissionDate = parseDateSafely(form.createdAt);
          } else if (form.timestamp) {
            submissionDate = parseDateSafely(form.timestamp);
          } else if (form.dateTime) {
            submissionDate = parseDateSafely(form.dateTime);
          } else if (form.movedToHistoryAt) {
            submissionDate = parseDateSafely(form.movedToHistoryAt);
          } else {
            submissionDate = new Date(); // Default to current date if no date found
          }
          
          const formattedDate = submissionDate ? formatDate(submissionDate) : 'Unknown Date';
          
          // Determine session type
          const isReferral = form.isReferral === true;
          let sessionType;
          if (isReferral) {
            sessionType = 'Referral';
          } else if (form.selectedMode === 'Online' || form.type === 'Online') {
            sessionType = 'Online';
          } else {
            sessionType = 'Walk-in';
          }
          
          // Get status with fallbacks
          const status = form.status || 'Pending';
          const remarks = form.remarks || '';
          
          // Count by college
          collegeCounts[collegeName] = (collegeCounts[collegeName] || 0) + 1;
          
          // Count by session type
          sessionTypes[sessionType] = (sessionTypes[sessionType] || 0) + 1;
          
          // Count total students
          totalStudents++;
          
          // Count new requests since yesterday
          if (submissionDate && isAfter(submissionDate, yesterday)) {
            newRequests++;
          }
          
          // Count completed sessions this month
          if (status === 'Completed' && submissionDate && isAfter(submissionDate, thisMonthStart)) {
            completedSessions++;
          }
          
          // Count no-shows this week
          if ((status === 'No-show' || status === 'No Show' || 
               remarks === 'No Show' || remarks === 'No-show') && 
              submissionDate && isAfter(submissionDate, thisWeekStart)) {
            noShows++;
          }
          
          // Add to recent activities (limit to most recent 3)
          if (recentActivitiesList.length < 3) {
            recentActivitiesList.push({
              id: form.id || `form-${recentActivitiesList.length}`,
              studentName: studentName, 
              course: collegeName,
              yearSection: yearSection,
              submissionDate: formattedDate,
              isReferral,
              type: sessionType
            });
          }
        } catch (formError) {
          console.error("Error processing form:", formError, form.id);
        }
      });

      // Sort recent activities by date (newest first)
      recentActivitiesList.sort((a, b) => {
        const dateA = new Date(a.submissionDate);
        const dateB = new Date(b.submissionDate);
        return dateB - dateA;
      });

      // Prepare pie chart data for colleges
      const collegeData = {
        labels: Object.keys(collegeCounts),
        datasets: [
          {
            label: 'Students per College',
            data: Object.values(collegeCounts),
            backgroundColor: chartColors.backgroundColor.slice(0, Object.keys(collegeCounts).length),
            borderColor: chartColors.borderColor.slice(0, Object.keys(collegeCounts).length),
            borderWidth: 1,
          },
        ],
      };

      // Prepare bar chart data for session types
      const sessionData = {
        labels: Object.keys(sessionTypes),
        datasets: [
          {
            label: 'Session Types',
            data: Object.values(sessionTypes),
            backgroundColor: chartColors.backgroundColor.slice(0, 3),
            borderColor: chartColors.borderColor.slice(0, 3),
            borderWidth: 1,
          },
        ],
      };

      // Set chart options
      const options = {
        plugins: {
          legend: {
            position: 'right',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false,
      };

      // Update all state variables
      setStudentsPerCollegeData(collegeData);
      setSessionTypesData(sessionData);
      setChartOptions(options);
      setDashboardStats({
        totalStudents,
        newRequests,
        completedSessions,
        noShows
      });
      setRecentActivities(recentActivitiesList);

      // Store processed data in cache
      dashboardCache.data = {
        collegeData,
        sessionData,
        options,
        stats: {
          totalStudents,
          newRequests,
          completedSessions,
          noShows
        },
        recentActivities: recentActivitiesList
      };
      dashboardCache.lastFetched = Date.now();
      
    } catch (error) {
      console.error("Error processing forms data:", error);
      setError("Error processing dashboard data: " + error.message);
    }
  };

  // Main data fetching function
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we have valid cached data
      const now = Date.now();
      if (
        dashboardCache.data && 
        dashboardCache.lastFetched && 
        (now - dashboardCache.lastFetched < dashboardCache.expiryTime)
      ) {
        console.log("Using cached dashboard data");
        
        // Use cached data
        setStudentsPerCollegeData(dashboardCache.data.collegeData);
        setSessionTypesData(dashboardCache.data.sessionData);
        setChartOptions(dashboardCache.data.options);
        setDashboardStats(dashboardCache.data.stats);
        setRecentActivities(dashboardCache.data.recentActivities);
        setLoading(false);
        return;
      }
      
      console.log("Fetching fresh dashboard data...");
      
      // Fetch all data types concurrently
      const [formsResult, referralsResult, historyResult] = await Promise.all([
        getStudentInterviewForms(),
        getReferrals(),
        getCompletedInterviewForms()
      ]);
      
      // Combine all forms
      let allForms = [];
      
      if (formsResult.success) {
        const regularForms = formsResult.forms || [];
        console.log(`Successfully fetched ${regularForms.length} regular forms`);
        allForms = [...allForms, ...regularForms];
      } else {
        console.error("Failed to fetch regular forms:", formsResult.error);
        setError(formsResult.error || "Failed to fetch regular forms");
      }
      
      // Handle referrals
      if (referralsResult && referralsResult.success) {
        const referrals = referralsResult.referrals || [];
        console.log(`Successfully fetched ${referrals.length} referrals`);
        allForms = [...allForms, ...referrals];
      } else {
        console.error("Failed to fetch referrals:", referralsResult?.error || "Unknown error");
      }
      
      // Handle history forms
      if (historyResult && historyResult.success) {
        const historyForms = historyResult.forms || [];
        console.log(`Successfully fetched ${historyForms.length} history forms`);
        allForms = [...allForms, ...historyForms];
      } else {
        console.error("Failed to fetch history forms:", historyResult?.error || "Unknown error");
      }
      
      console.log(`Total forms to process: ${allForms.length}`);
      
      // Process data for dashboard
      processFormsData(allForms);
      
    } catch (error) {
      console.error("Error in fetchDashboardData:", error);
      setError("Failed to load dashboard data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
    
    // Add event listener for visibility change to handle tab switching
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When tab becomes visible again, check if we need to refresh data
        const now = Date.now();
        if (!dashboardCache.lastFetched || (now - dashboardCache.lastFetched > dashboardCache.expiryTime)) {
          console.log("Tab visible again, refreshing data");
          fetchDashboardData();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup listener on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <AdminNavbar />
      {/* Dashboard Content */}
      <div className="max-w-8xl mx-auto mt- px-6 pt-12">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">Loading dashboard data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        ) : (
          <>
            {/* Cards Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-7">
              <div className="bg-white border p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-bold">Total Sessions</h2>
                <p className="text-4xl font-bold">{dashboardStats.totalStudents}</p>
                <p className="text-gray-600 text-sm">This semester</p>
              </div>
              <div className="bg-white border p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-bold">New Requests</h2>
                <p className="text-4xl font-bold">{dashboardStats.newRequests}</p>
                <p className="text-gray-600 text-sm">Since yesterday</p>
              </div>
              <div className="bg-white border p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-bold">Completed Sessions</h2>
                <p className="text-4xl font-bold">{dashboardStats.completedSessions}</p>
                <p className="text-gray-600 text-sm">This month</p>
              </div>
              <div className="bg-white border p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-bold">No-shows</h2>
                <p className="text-4xl font-bold">{dashboardStats.noShows}</p>
                <p className="text-gray-600 text-sm">This week</p>
              </div>
            </div>

            {/* Recent Activity & Notifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* Recent Activity */}
              <div className="bg-white border p-6 rounded-lg shadow-md">
                <div className="flex justify-between">
                  <h2 className="text-lg font-bold">Recent Activity</h2>
                  <button 
                    onClick={() => navigate("/SubmittedFormsManagement")} 
                    className="text-gray-700 font-medium hover:text-[#3A0323] transition-colors cursor-pointer"
                  >
                    See all
                  </button>
                </div>
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="mt-4 border-b pb-2">
                      <p className="font-semibold">
                        {activity.type}: {activity.studentName} ({activity.course}
                        {activity.yearSection !== 'N/A' ? ` - ${activity.yearSection}` : ''})
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {activity.submissionDate}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="mt-4 text-gray-500">No recent activities</p>
                )}
              </div>

              {/* Notifications */}
              <div className="bg-white border p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-bold">Notifications</h2>
                <div className="mt-4">
                  {dashboardStats.newRequests > 0 ? (
                    <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded mb-3">
                      <p className="text-yellow-800">
                        <span className="font-bold">{dashboardStats.newRequests}</span> new {dashboardStats.newRequests === 1 ? 'request' : 'requests'} since yesterday
                      </p>
                    </div>
                  ) : null}
                  
                  {dashboardStats.noShows > 0 ? (
                    <div className="p-3 bg-red-50 border-l-4 border-red-400 rounded mb-3">
                      <p className="text-red-800">
                        <span className="font-bold">{dashboardStats.noShows}</span> no-{dashboardStats.noShows === 1 ? 'show' : 'shows'} this week
                      </p>
                    </div>
                  ) : null}
                  
                  {dashboardStats.completedSessions > 0 ? (
                    <div className="p-3 bg-green-50 border-l-4 border-green-400 rounded">
                      <p className="text-green-800">
                        <span className="font-bold">{dashboardStats.completedSessions}</span> {dashboardStats.completedSessions === 1 ? 'session' : 'sessions'} completed this month
                      </p>
                    </div>
                  ) : null}
                  
                  {dashboardStats.newRequests === 0 && dashboardStats.noShows === 0 && dashboardStats.completedSessions === 0 && (
                    <p className="text-gray-500">No new notifications</p>
                  )}
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* Pie Chart */}
              <div className="bg-white border p-6 rounded-lg shadow-md pb-8">
                <h2 className="text-lg font-bold">Students per College</h2>
                {Object.keys(studentsPerCollegeData).length > 0 && studentsPerCollegeData.labels?.length > 0 ? (
                  <Chart type="pie" data={studentsPerCollegeData} options={chartOptions} style={{ width: '100%', height: '250px' }} />
                ) : (
                  <p className="flex justify-center items-center h-64 text-gray-500">No data available</p>
                )}
              </div>

              {/* Bar Chart */}
              <div className="bg-white border p-6 rounded-lg shadow-md pb-8">
                <h2 className="text-lg font-bold">Session Types</h2>
                {Object.keys(sessionTypesData).length > 0 && sessionTypesData.labels?.length > 0 ? (
                  <Chart type="bar" data={sessionTypesData} options={chartOptions} style={{ width: '100%', height: '250px' }} />
                ) : (
                  <p className="flex justify-center items-center h-64 text-gray-500">No data available</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;