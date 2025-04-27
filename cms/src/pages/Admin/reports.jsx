import React, { useState, useEffect } from 'react';
import AdminNavbar from '../ui/adminnavbar';
import { Dropdown } from 'primereact/dropdown';
import { 
  getStudentInterviewForms, 
  getReferrals,
  getCompletedInterviewForms 
} from '../../firebase/firestoreService';
import { CSVLink } from 'react-csv';
import SummaryStatisticsSection from '../../components/SummaryStatisticsSection';
import ChartsSection from '../../components/ChartsSection';
import { 
  processChartData, 
  calculateSummaryStatistics, 
  filterFormsByTimeframe, 
  filterFormsByCollege,
  prepareCSVData
} from '../../components/reportHelpers';

function Reports() {
  const [studentsPerCollegeData, setStudentsPerCollegeData] = useState({});
  const [sessionTypesData, setSessionTypesData] = useState({});
  const [counselingSessionsData, setCounselingSessionsData] = useState({});
  const [yearPerCollegesData, setYearPerCollegesData] = useState({});
  const [remarksDistributionData, setRemarksDistributionData] = useState({});
  const [chartOptions, setChartOptions] = useState({});
  const [selectedTimeframe, setSelectedTimeframe] = useState('thisMonth');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryStats, setSummaryStats] = useState({
    totalSessions: 0,
    totalCompletedSessions: 0,
    averageSessionsPerDay: 0,
    mostActiveCollege: '',
    leastActiveCollege: '',
    mostCommonReason: '',
    mostCommonRemark: ''
  });

  // Constants for dropdown options
  const timeframeOptions = [
    { label: 'This Week', value: 'thisWeek' },
    { label: 'Last Week', value: 'lastWeek' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last Month', value: 'lastMonth' },
    { label: 'Past 3 Months', value: 'past3Months' },
    { label: 'All Time', value: 'allTime' },
  ];

  const collegeOptions = [
    { label: 'All Colleges', value: 'all' },
    { label: 'CAH (College of Arts and Humanities)', value: 'cah' },
    { label: 'CMBS (College of Medical and Biological Science)', value: 'cmbs' },
    { label: 'CCS (College of Computer Studies)', value: 'ccs' },
    { label: 'CABE (College of Accounting and Business Education)', value: 'cabe' },
    { label: 'CEA (College of Engineering and Architecture)', value: 'cea' },
    { label: 'CHESFS (College of Human Environmental Sciences and Food Studies)', value: 'chesfs' },
    { label: 'CM (College of Music)', value: 'cm' },
    { label: 'CN (College of Nursing)', value: 'cn' },
    { label: 'CPC (College of Pharmacy and Chemistry)', value: 'cpc' },
    { label: 'CTE (College of Teacher Education)', value: 'cte' }
  ];

  useEffect(() => {
    fetchDataAndGenerateReports();
  }, [selectedTimeframe, selectedCollege]);

  // In fetchDataAndGenerateReports function
const fetchDataAndGenerateReports = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Fetch regular forms, referrals, and history forms concurrently
    const [formsResult, referralsResult, historyResult] = await Promise.all([
      getStudentInterviewForms(),
      getReferrals(),
      getCompletedInterviewForms() // Add this to fetch from history collection
    ]);
    
    // Handle errors from fetch operations
    if (!formsResult.success) {
      console.error("Failed to fetch regular forms:", formsResult.error);
      setError(formsResult.error || "Failed to fetch regular forms");
      setLoading(false);
      return;
    }
    
    // Process regular forms
    const regularForms = formsResult.forms || [];
    console.log(`Total regular forms fetched: ${regularForms.length}`);
    
    // Process referrals
    let referrals = [];
    if (referralsResult && referralsResult.success) {
      referrals = referralsResult.referrals || [];
      console.log(`Total referrals fetched: ${referrals.length}`);
    } else {
      console.warn("Failed to fetch referrals:", referralsResult?.error || "Unknown error");
    }
    
    // Process history forms
    let historyForms = [];
    if (historyResult && historyResult.success) {
      historyForms = historyResult.forms || [];
      console.log(`Total history forms fetched: ${historyForms.length}`);
    } else {
      console.warn("Failed to fetch history forms:", historyResult?.error || "Unknown error");
    }
    
    // Combine all forms
    const allForms = [...regularForms, ...referrals, ...historyForms];
    console.log(`Combined total forms: ${allForms.length}`);
    
    // Preprocess the forms to ensure consistent field naming
    const processedForms = allForms.map(form => {
      // Get student name consistently
      const studentName = form.name || form.studentName || form.fullName || form.clientName || 'Student';
      
      // Get session type consistently - ensure referrals are properly identified
      const isReferral = form.isReferral === true;
      const sessionType = isReferral ? 'Referral' : 
                         (form.selectedMode || form.type || 'Walk-in');
      
      // Get department/college consistently
      let college = '';
      if (form.college) {
        // If it already contains "College of", use it directly
        if (form.college.toLowerCase().includes('college of')) {
          college = form.college;
        } else {
          college = getDepartmentFromCourse(form.college);
        }
      } else if (form.course) {
        // For referrals that have a course field
        college = getDepartmentFromCourse(form.course);
      } else if (form.courseYearSection) {
        // Try to extract college from courseYearSection
        const parts = form.courseYearSection.split(' ');
        if (parts.length > 0) {
          college = getDepartmentFromCourse(parts[0]);
        }
      }
      
      // Get year consistently
      let year = '';
      if (form.year) {
        year = `Year ${form.year}`;
      } else if (form.courseYearSection) {
        const match = form.courseYearSection.match(/(\d+[A-Za-z]*)/);
        if (match) {
          year = `Year ${match[1]}`;
        }
      }
      
      // Get all possible date fields with better fallbacks for referrals
      let appointmentDate = null;
      
      // For referrals, prioritize the date field
      if (isReferral && form.date) {
        appointmentDate = form.date;
      } 
      // For regular sessions and other cases
      else {
        appointmentDate = form.appointmentDate || form.scheduledDate || 
                         form.selectedDate || form.dateTime || form.date ||
                         form.submissionDate || form.createdAt || form.movedToHistoryAt;
      }
      
      return {
        ...form,
        processedStudentName: studentName,
        processedSessionType: sessionType,
        processedCollege: college || 'Unknown College',
        processedYear: year,
        processedAppointmentDate: appointmentDate,
        isReferral: isReferral // Ensure this flag is set
      };
    });
    
    setReportData(processedForms);
    
    // Filter data based on selected timeframe
    const filteredForms = filterFormsByTimeframe(processedForms, selectedTimeframe);
    
    // Further filter by college if needed
    const collegeFilteredForms = filterFormsByCollege(filteredForms, selectedCollege);
    
    // Process data for charts and set chart states
    // Process data for charts and set chart states
    processChartData(
      collegeFilteredForms,
      getDepartmentFromCourse,  // Pass the function reference
      setStudentsPerCollegeData,
      setSessionTypesData,
      setCounselingSessionsData,
      setYearPerCollegesData,
      setRemarksDistributionData,
      setChartOptions
    );

    // Calculate summary statistics - pass getDepartmentFromCourse here too
    const stats = calculateSummaryStatistics(collegeFilteredForms, getDepartmentFromCourse);
    setSummaryStats(stats);
    
  } catch (error) {
    console.error("Error generating reports:", error);
    setError("Failed to generate reports: " + error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-white">
      <AdminNavbar />

      {/* Dashboard Content */}
      <div className="max-w-8xl mx-auto mt- px-6 pt-12">
        <h1 className="text-3xl font-bold mb-6">Counseling Reports</h1>

        {/* Filters */}
        <div className="flex justify-end space-x-4 mb-8">
          <Dropdown
            value={selectedTimeframe}
            options={timeframeOptions}
            onChange={(e) => setSelectedTimeframe(e.value)}
            placeholder="Select Timeframe"
            className="w-48 custom-dropdown"
            dropdownIcon="pi pi-chevron-down"
          />
          
          <Dropdown
            value={selectedCollege}
            options={collegeOptions}
            onChange={(e) => setSelectedCollege(e.value)}
            placeholder="Select a College"
            className="w-48 custom-dropdown"
            dropdownIcon="pi pi-chevron-down"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">Loading report data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        ) : (
          <>
            {/* Summary Statistics Section */}
            <SummaryStatisticsSection stats={summaryStats} />

            {/* Charts Section */}
            <ChartsSection 
              studentsPerCollegeData={studentsPerCollegeData}
              sessionTypesData={sessionTypesData}
              counselingSessionsData={counselingSessionsData}
              yearPerCollegesData={yearPerCollegesData}
              remarksDistributionData={remarksDistributionData}
              chartOptions={chartOptions}
            />

            {/* Export Button */}
            <div className="flex justify-center mt-4 mb-8">
              {reportData.length > 0 ? (
                <CSVLink
                  data={prepareCSVData(reportData)}
                  filename={`counseling-report-${new Date().toISOString().split('T')[0]}.csv`}
                  className="bg-[#3A0323] hover:bg-[#2a0114] text-white font-bold py-2 px-4 rounded text-sm"
                >
                  Export Data as CSV
                </CSVLink>
              ) : (
                <button className="bg-gray-300 text-white font-bold py-2 px-4 rounded text-sm cursor-not-allowed" disabled>
                  No Data to Export
                </button>
              )}
            </div>
          </>
        )}
      </div>
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

export default Reports;