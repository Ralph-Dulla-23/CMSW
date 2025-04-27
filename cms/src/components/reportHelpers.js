// Chart colors
export const chartColors = {
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
};

// Helper function to determine department from course code
export const getDepartmentFromCourse = (courseCode) => {
  if (!courseCode) return 'Unknown College';

  // Extract the program/degree code from the course code
  // This assumes the course code starts with the program abbreviation
  const programCode = courseCode.split(' ')[0]; // Get first part before any spaces

  // Map program codes to their respective colleges
  const collegeMap = {
    // College of Accounting and Business Education (CABE)
    'BSA': 'College of Accounting and Business Education',
    'BSMA': 'College of Accounting and Business Education', // Management Accounting
    'BSAIS': 'College of Accounting and Business Education', // Accounting Information System
    'BSBA': 'College of Accounting and Business Education', // Business Administration
    'BSREM': 'College of Accounting and Business Education', // Real Estate Management
    
    // College of Arts and Humanities (CAH)
    'AB': 'College of Arts and Humanities',
    'ABCOM': 'College of Arts and Humanities', // Communication
    'ABELS': 'College of Arts and Humanities', // English Language Studies
    'ABPhilo': 'College of Arts and Humanities', // Philosophy
    'ABPsych': 'College of Arts and Humanities', // Psychology
    
    // College of Computer Studies (CCS)
    'BSCS': 'College of Computer Studies',
    'BSIS': 'College of Computer Studies', // Information Systems
    'BSIT': 'College of Computer Studies', // Information Technology
    
    // College of Engineering and Architecture (CEA)
    'BSArch': 'College of Engineering and Architecture', // Architecture
    'BSCE': 'College of Engineering and Architecture', // Civil Engineering
    'BSCpE': 'College of Engineering and Architecture', // Computer Engineering
    'BSECE': 'College of Engineering and Architecture', // Electronics Engineering
    
    // College of Human Environmental Sciences and Food Studies (CHESFS)
    'BSND': 'College of Human Environmental Sciences and Food Studies', // Nutrition and Dietetics
    'BSHRM': 'College of Human Environmental Sciences and Food Studies', // Hotel Restaurant Management
    'BSTM': 'College of Human Environmental Sciences and Food Studies', // Tourism Management
    
    // College of Medical and Biological Science (CMBS)
    'BSBio': 'College of Medical and Biological Science', // Biology
    'BSMLS': 'College of Medical and Biological Science', // Medical Laboratory Science
    
    // College of Music (CM)
    'BM': 'College of Music',
    
    // College of Nursing (CN)
    'BSN': 'College of Nursing', // Nursing
    
    // College of Pharmacy and Chemistry (CPC)
    'BSP': 'College of Pharmacy and Chemistry', // Pharmacy
    'BSChem': 'College of Pharmacy and Chemistry', // Chemistry
    
    // College of Teacher Education (CTE)
    'BECE': 'College of Teacher Education', // Early Childhood Education
    'BEEd': 'College of Teacher Education', // Elementary Education
    'BSEd': 'College of Teacher Education', // Secondary Education
    'BSNE': 'College of Teacher Education', // Special Needs Education
    'BPE': 'College of Teacher Education', // Physical Education
  };

  // Check for exact matches first
  if (collegeMap[programCode]) {
    return collegeMap[programCode];
  }

  // For codes that might be variations or not exact matches
  // Check if the course code starts with any of the keys in the collegeMap
  for (const prefix in collegeMap) {
    if (programCode.startsWith(prefix)) {
      return collegeMap[prefix];
    }
  }

  // Additional pattern matching for special cases
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

  return 'Unknown College'; // Default if no match is found
};

// Helper function to safely parse dates
export const parseDateSafely = (dateValue) => {
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
    return !isNaN(date.getTime()) ? date : null;
  } catch (error) {
    console.error("Error parsing date:", error, dateValue);
    return null;
  }
};

// Filter forms by timeframe
export const filterFormsByTimeframe = (forms, timeframe) => {
  const now = new Date();
  let startDate;
  let endDate;

  // Get start of current week (Sunday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  // Get start of last week
  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  // Get end of last week
  const endOfLastWeek = new Date(startOfWeek);
  endOfLastWeek.setSeconds(endOfLastWeek.getSeconds() - 1);

  switch (timeframe) {
    case 'thisWeek':
      startDate = startOfWeek;
      break;
      
    case 'lastWeek':
      startDate = startOfLastWeek;
      endDate = endOfLastWeek;
      return forms.filter(form => {
        // Check all possible date fields
        const formDate = getFormDate(form);
        return formDate && formDate >= startDate && formDate <= endDate;
      });
      
    case 'thisMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
      
    case 'lastMonth':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return forms.filter(form => {
        const formDate = getFormDate(form);
        return formDate && formDate >= startDate && formDate <= endDate;
      });
      
    case 'past3Months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;
      
    case 'allTime':
      return forms; // Return all forms without date filtering
      
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return forms.filter(form => {
    const formDate = getFormDate(form);
    return formDate && formDate >= startDate;
  });
};

// Helper function to get the most relevant date from a form
function getFormDate(form) {
  // For referrals, prioritize the date field
  if (form.isReferral && form.date) {
    return parseDateSafely(form.date);
  }
  
  // For follow-ups, prioritize the followUpDate
  if (form.remarks === 'Follow up' && form.followUpDate) {
    return parseDateSafely(form.followUpDate);
  }

  // Check all possible date fields in order of priority
  if (form.appointmentDate) {
    return parseDateSafely(form.appointmentDate);
  }

  if (form.scheduledDate) {
    return parseDateSafely(form.scheduledDate);
  }

  if (form.selectedDate) {
    return parseDateSafely(form.selectedDate);
  }

  if (form.date) {
    return parseDateSafely(form.date);
  }

  if (form.submissionDate) {
    return parseDateSafely(form.submissionDate);
  }

  if (form.dateTime) {
    return parseDateSafely(form.dateTime);
  }

  if (form.createdAt) {
    return parseDateSafely(form.createdAt);
  }

  return null;
}

// Filter forms by college
export const filterFormsByCollege = (forms, college, getDepartmentFromCourse) => {
  if (college === 'all') return forms;

  // Map college values to the full college names
  const collegeFullNameMap = {
    'cah': 'College of Arts and Humanities',
    'cmbs': 'College of Medical and Biological Science',
    'ccs': 'College of Computer Studies',
    'cabe': 'College of Accounting and Business Education',
    'cea': 'College of Engineering and Architecture',
    'chesfs': 'College of Human Environmental Sciences and Food Studies',
    'cm': 'College of Music',
    'cn': 'College of Nursing',
    'cpc': 'College of Pharmacy and Chemistry',
    'cte': 'College of Teacher Education'
  };

  const fullCollegeName = collegeFullNameMap[college];
  if (!fullCollegeName) return forms;

  return forms.filter(form => {
    // Check both direct college field and courseYearSection
    if (form.college) {
      // If it already contains "College of", check directly
      if (form.college.toLowerCase().includes('college of')) {
        return form.college === fullCollegeName;
      }
      // Otherwise, use getDepartmentFromCourse
      return getDepartmentFromCourse(form.college) === fullCollegeName;
    }
    
    // For referrals, check the course field
    if (form.isReferral && form.course) {
      return getDepartmentFromCourse(form.course) === fullCollegeName;
    }
    
    const courseYearSection = form.courseYearSection || '';
    // Use the getDepartmentFromCourse function to determine the college
    const collegeName = getDepartmentFromCourse(courseYearSection);
    return collegeName === fullCollegeName;
  });
};

// Process chart data
export const processChartData = (
  forms,
  getDepartmentFromCourse,
  setStudentsPerCollegeData,
  setSessionTypesData,
  setCounselingSessionsData,
  setYearPerCollegesData,
  setRemarksDistributionData,
  setChartOptions  // Add this parameter
) => {
  // Process Students per College (Pie Chart)
  const collegeCountMap = {
    'College of Arts and Humanities': 0,
    'College of Medical and Biological Science': 0,
    'College of Computer Studies': 0,
    'College of Accounting and Business Education': 0,
    'College of Engineering and Architecture': 0,
    'College of Human Environmental Sciences and Food Studies': 0,
    'College of Music': 0,
    'College of Nursing': 0,
    'College of Pharmacy and Chemistry': 0,
    'College of Teacher Education': 0,
    'Unknown College': 0
  };

  // Process Session Types (Bar Chart)
  const sessionTypeMap = {
    'Referral': 0,
    'Walk-in': 0,
    'Online': 0
  };

  // Process Counseling Sessions Over Time (Line Chart)
  const sessionsOverTime = {};

  // Process Year per Colleges (Bar Chart)
  const yearCountMap = {
    '1st Year': 0,
    '2nd Year': 0,
    '3rd Year': 0,
    '4th Year': 0,
    'Other': 0
  };

  // Process Remarks Distribution (Pie Chart)
  const remarksMap = {
    'Attended': 0,
    'No Show': 0,
    'No Response': 0,
    'Terminated': 0,
    'Follow up': 0,
    'None': 0
  };

  forms.forEach(form => {
    // Process college data
    let collegeName = form.processedCollege || 'Unknown College';
    if (collegeCountMap.hasOwnProperty(collegeName)) {
      collegeCountMap[collegeName]++;
    } else {
      collegeCountMap['Unknown College']++;
    }
    
    // Process session type
    const sessionType = form.processedSessionType || 'Walk-in';
    if (sessionTypeMap.hasOwnProperty(sessionType)) {
      sessionTypeMap[sessionType]++;
    } else {
      // Default to Walk-in if not recognized
      sessionTypeMap['Walk-in']++;
    }
    
    // Process date for time series
    if (form.processedAppointmentDate) {
      const date = new Date(form.processedAppointmentDate);
      if (!isNaN(date.getTime())) {
        const dateStr = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        if (!sessionsOverTime[dateStr]) {
          sessionsOverTime[dateStr] = 0;
        }
        sessionsOverTime[dateStr]++;
      }
    }
    
    // Process year level
    let yearLevel = 'Other';
    if (form.processedYear) {
      if (form.processedYear.includes('1')) yearLevel = '1st Year';
      else if (form.processedYear.includes('2')) yearLevel = '2nd Year';
      else if (form.processedYear.includes('3')) yearLevel = '3rd Year';
      else if (form.processedYear.includes('4')) yearLevel = '4th Year';
    }
    yearCountMap[yearLevel]++;
    
    // Process remarks
    const remark = form.remarks || 'None';
    if (remarksMap.hasOwnProperty(remark)) {
      remarksMap[remark]++;
    } else {
      remarksMap['None']++;
    }
  });

  // For the chart, use abbreviated names to fit better
  const collegeLabels = Object.keys(collegeCountMap).map(name => {
    if (name === 'Unknown College') return name;
    // Extract abbreviation from college name
    switch(name) {
      case 'College of Arts and Humanities': return 'CAH';
      case 'College of Medical and Biological Science': return 'CMBS';
      case 'College of Computer Studies': return 'CCS';
      case 'College of Accounting and Business Education': return 'CABE';
      case 'College of Engineering and Architecture': return 'CEA';
      case 'College of Human Environmental Sciences and Food Studies': return 'CHESFS';
      case 'College of Music': return 'CM';
      case 'College of Nursing': return 'CN';
      case 'College of Pharmacy and Chemistry': return 'CPC';
      case 'College of Teacher Education': return 'CTE';
      default: return name;
    }
  });

  // Prepare Students per College data
  setStudentsPerCollegeData({
    labels: collegeLabels,
    datasets: [
      {
        label: 'Students per College',
        data: Object.values(collegeCountMap),
        backgroundColor: chartColors.backgroundColor,
        borderColor: chartColors.borderColor,
        borderWidth: 1,
      },
    ],
  });

  // Prepare Session Types data
  setSessionTypesData({
    labels: Object.keys(sessionTypeMap),
    datasets: [
      {
        label: 'Session Types',
        data: Object.values(sessionTypeMap),
        backgroundColor: chartColors.backgroundColor.slice(0, 3),
        borderColor: chartColors.borderColor.slice(0, 3),
        borderWidth: 1,
      },
    ],
  });

  // Prepare Counseling Sessions Over Time data
  // Sort dates for the line chart
  const sortedDates = Object.keys(sessionsOverTime).sort();
  setCounselingSessionsData({
    labels: sortedDates,
    datasets: [
      {
        label: 'Counseling Sessions',
        data: sortedDates.map(date => sessionsOverTime[date]),
        fill: false,
        borderColor: 'rgb(239, 68, 68)',
        tension: 0.4,
      },
    ],
  });

  // Prepare Year per Colleges data
  setYearPerCollegesData({
    labels: Object.keys(yearCountMap),
    datasets: [
      {
        label: 'Students',
        data: Object.values(yearCountMap),
        backgroundColor: chartColors.backgroundColor,
        borderColor: chartColors.borderColor,
        borderWidth: 1,
      },
    ],
  });

  // Prepare Remarks Distribution data
  setRemarksDistributionData({
    labels: Object.keys(remarksMap),
    datasets: [
      {
        label: 'Remarks Distribution',
        data: Object.values(remarksMap),
        backgroundColor: chartColors.backgroundColor,
        borderColor: chartColors.borderColor,
        borderWidth: 1,
      },
    ],
  });

  // Set chart options
  setChartOptions({
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0 // Show only whole numbers
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'center',
        labels: {
          color: '#495057',
          boxWidth: 12,
          font: {
            size: 10
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y;
            }
            return label;
          }
        }
      }
    },
    maintainAspectRatio: false,
    responsive: true
  });
};

// Calculate summary statistics
// In reportHelpers.js
export const calculateSummaryStatistics = (forms, getDepartmentFromCourse) => {
  // Total sessions
  const totalSessions = forms.length;

  // Total completed sessions (with status 'Completed')
  const totalCompletedSessions = forms.filter(form => form.status === 'Completed').length;

  // Average sessions per day
  const sessionsPerDay = {};
  forms.forEach(form => {
    const formDate = getFormDate(form);
    if (formDate) {
      const date = formDate.toISOString().split('T')[0];
      sessionsPerDay[date] = (sessionsPerDay[date] || 0) + 1;
    }
  });

  const totalDays = Object.keys(sessionsPerDay).length || 1;
  const averageSessionsPerDay = (totalSessions / totalDays).toFixed(1);

  // Most/least active college
  const collegeCount = {
    'College of Arts and Humanities': 0,
    'College of Medical and Biological Science': 0,
    'College of Computer Studies': 0,
    'College of Accounting and Business Education': 0,
    'College of Engineering and Architecture': 0,
    'College of Human Environmental Sciences and Food Studies': 0,
    'College of Music': 0,
    'College of Nursing': 0,
    'College of Pharmacy and Chemistry': 0,
    'College of Teacher Education': 0,
    'Unknown College': 0
  };

  forms.forEach(form => {
    let collegeName = 'Unknown College';
    
    // Use the processedCollege field if available
    if (form.processedCollege) {
      collegeName = form.processedCollege;
    }
    // Otherwise use the getDepartmentFromCourse function
    else if (form.college) {
      collegeName = getDepartmentFromCourse(form.college);
    } else if (form.course) {
      collegeName = getDepartmentFromCourse(form.course);
    } else if (form.courseYearSection) {
      collegeName = getDepartmentFromCourse(form.courseYearSection);
    }
    
    if (collegeCount.hasOwnProperty(collegeName)) {
      collegeCount[collegeName]++;
    } else {
      collegeCount['Unknown College']++;
    }
  });


  let mostActiveCollege = 'None';
  let leastActiveCollege = 'None';
  let maxCount = -1;
  let minCount = Infinity;

  Object.entries(collegeCount).forEach(([college, count]) => {
    // Convert full college names to abbreviations for display
    const getCollegeAbbr = (name) => {
      if (name === 'Unknown College') return name;
      switch(name) {
        case 'College of Arts and Humanities': return 'CAH';
        case 'College of Medical and Biological Science': return 'CMBS';
        case 'College of Computer Studies': return 'CCS';
        case 'College of Accounting and Business Education': return 'CABE';
        case 'College of Engineering and Architecture': return 'CEA';
        case 'College of Human Environmental Sciences and Food Studies': return 'CHESFS';
        case 'College of Music': return 'CM';
        case 'College of Nursing': return 'CN';
        case 'College of Pharmacy and Chemistry': return 'CPC';
        case 'College of Teacher Education': return 'CTE';
        default: return name;
      }
    };
    
    if (count > maxCount) {
      mostActiveCollege = getCollegeAbbr(college);
      maxCount = count;
    }
    
    if (count < minCount && count > 0) {
      leastActiveCollege = getCollegeAbbr(college);
      minCount = count;
    }
  });

  // Most common reason - updated to handle all possible concern formats
  const reasonCount = {};
  forms.forEach(form => {
    let reason = 'Not specified';
    
    // Check for academicConcerns and personalConcerns arrays (referrals)
    if (form.academicConcerns && form.academicConcerns.length > 0) {
      reason = form.academicConcerns[0];
    } else if (form.personalConcerns && form.personalConcerns.length > 0) {
      reason = form.personalConcerns[0];
    }
    // Check for modern structure with academics/personal objects
    else if (form.academics) {
      if (form.academics.difficultyUnderstanding) reason = 'Difficulty understanding lessons';
      else if (form.academics.notPrepared) reason = 'Not prepared/motivated to study';
      else if (form.academics.overlyWorried) reason = 'Overly worried about academic performance';
      else if (form.academics.problemBeingOnTime) reason = 'Problem being on time for class';
      else if (form.academics.notHappyWithCourse) reason = 'Not happy with course';
      else if (form.academics.issueWithTeacher) reason = 'Issues with teacher/professor';
      else if (form.academics.homesickness) reason = 'Homesickness affecting studies';
      else if (form.academics.academicOthers) reason = form.academics.academicOthers;
    } else if (form.personal) {
      if (form.personal.confident) reason = 'Lack of confidence/self-esteem';
      else if (form.personal.decision) reason = 'Difficulty making decisions';
      else if (form.personal.sleeping) reason = 'Problems with sleeping';
      else if (form.personal.mood) reason = 'Unstable mood';
      else if (form.personal.stress) reason = 'Stress management issues';
      else if (form.personal.emotion) reason = 'Emotional regulation difficulties';
      else if (form.personal.time) reason = 'Time management issues';
      else if (form.personal.worry) reason = 'Excessive worry/anxiety';
      else if (form.personal.selfHarm) reason = 'Self-harm thoughts or behaviors';
      else if (form.personal.suicide) reason = 'Suicidal thoughts';
      else if (form.personal.disorder) reason = `Mental health concerns: ${form.personal.disorder}`;
    }
    // Check legacy formats
    else if (form.concerns) {
      if (form.concerns.academic && form.concerns.academic.length > 0) {
        reason = form.concerns.academic[0];
      } else if (form.concerns.personal && form.concerns.personal.length > 0) {
        reason = form.concerns.personal[0];
      }
    } else if (form.areasOfConcern) {
      const areas = form.areasOfConcern;
      if (areas.academic && areas.academic.length > 0) {
        reason = areas.academic[0];
      } else if (areas.personal && areas.personal.length > 0) {
        reason = areas.personal[0];
      } else if (areas.interpersonal && areas.interpersonal.length > 0) {
        reason = areas.interpersonal[0];
      } else if (areas.family && areas.family.length > 0) {
        reason = areas.family[0];
      }
    }
    
    reasonCount[reason] = (reasonCount[reason] || 0) + 1;
  });

  let mostCommonReason = 'None';
  let maxReasonCount = -1;

  Object.entries(reasonCount).forEach(([reason, count]) => {
    if (count > maxReasonCount) {
      mostCommonReason = reason;
      maxReasonCount = count;
    }
  });

  // Most common remark
  const remarkCount = {};
  forms.forEach(form => {
    const remark = form.remarks || 'None';
    remarkCount[remark] = (remarkCount[remark] || 0) + 1;
  });

  let mostCommonRemark = 'None';
  let maxRemarkCount = -1;

  Object.entries(remarkCount).forEach(([remark, count]) => {
    if (count > maxRemarkCount && remark !== 'None') {
      mostCommonRemark = remark;
      maxRemarkCount = count;
    }
  });

  return {
    totalSessions,
    totalCompletedSessions,
    averageSessionsPerDay,
    mostActiveCollege,
    leastActiveCollege,
    mostCommonReason,
    mostCommonRemark
  };
};

// Get concerns text for CSV export - updated to handle all concern formats
export const getConcernText = (form) => {
  const concerns = [];

  // Check for academicConcerns and personalConcerns arrays (referrals)
  if (form.academicConcerns && form.academicConcerns.length > 0) {
    concerns.push(...form.academicConcerns);
  }
  if (form.personalConcerns && form.personalConcerns.length > 0) {
    concerns.push(...form.personalConcerns);
  }
  
  // Check for modern structure with academics/personal objects
  if (form.academics) {
    if (form.academics.difficultyUnderstanding) concerns.push('Difficulty understanding lessons');
    if (form.academics.notPrepared) concerns.push('Not prepared/motivated to study');
    if (form.academics.overlyWorried) concerns.push('Overly worried about academic performance');
    if (form.academics.problemBeingOnTime) concerns.push('Problem being on time for class');
    if (form.academics.notHappyWithCourse) concerns.push('Not happy with course');
    if (form.academics.issueWithTeacher) concerns.push('Issues with teacher/professor');
    if (form.academics.homesickness) concerns.push('Homesickness affecting studies');
    if (form.academics.academicOthers) concerns.push(form.academics.academicOthers);
  }

  if (form.personal) {
    if (form.personal.confident) concerns.push('Lack of confidence/self-esteem');
    if (form.personal.decision) concerns.push('Difficulty making decisions');
    if (form.personal.sleeping) concerns.push('Problems with sleeping');
    if (form.personal.mood) concerns.push('Unstable mood');
    if (form.personal.stress) concerns.push('Stress management issues');
    if (form.personal.emotion) concerns.push('Emotional regulation difficulties');
    if (form.personal.time) concerns.push('Time management issues');
    if (form.personal.worry) concerns.push('Excessive worry/anxiety');
    if (form.personal.selfHarm) concerns.push('Self-harm thoughts or behaviors');
    if (form.personal.suicide) concerns.push('Suicidal thoughts');
    if (form.personal.disorder) concerns.push(`Mental health concerns: ${form.personal.disorder}`);
  }

  // Check legacy formats
  if (form.concerns) {
    if (form.concerns.academic && form.concerns.academic.length > 0) {
      concerns.push(...form.concerns.academic);
    }
    if (form.concerns.personal && form.concerns.personal.length > 0) {
      concerns.push(...form.concerns.personal);
    }
  } else if (form.areasOfConcern) {
    const areas = form.areasOfConcern;
    if (areas.academic && areas.academic.length > 0) {
      concerns.push(...areas.academic);
    }
    if (areas.personal && areas.personal.length > 0) {
      concerns.push(...areas.personal);
    }
    if (areas.interpersonal && areas.interpersonal.length > 0) {
      concerns.push(...areas.interpersonal);
    }
    if (areas.family && areas.family.length > 0) {
      concerns.push(...areas.family);
    }
  }

  // Check for otherConcerns field in referrals
  if (form.otherConcerns) {
    concerns.push(form.otherConcerns);
  }

  return concerns.length > 0 ? concerns.join(', ') : "Not specified";
};

// Prepare CSV data for export - updated to handle all field formats
export const prepareCSVData = (reportData) => {
  return reportData.map(form => ({
    'Student Name': form.studentName || form.fullName || form.name || form.clientName || 'N/A',
    'Course/Year/Section': form.courseYearSection || 
      (form.college && form.year ? 
        `${form.college} - Year ${form.year}${form.section ? ` Section ${form.section}` : ''}` : 
        (form.course && form.year ?
          `${form.course} - Year ${form.year}` :
          'N/A')),
    'College': form.college || getDepartmentFromCourse(form.course || form.courseYearSection || '') || 'N/A',
    'Appointment Date': formatDate(form.appointmentDate || form.scheduledDate || form.selectedDate || form.dateTime || form.date || form.submissionDate),
    'Appointment Time': form.scheduledTime || form.selectedTime || form.time || form.followUpTime || 'N/A',
    'Submission Date': formatDate(form.submissionDate || form.createdAt || form.dateTime),
    'Session Type': form.isReferral ? 'Referral' : (form.selectedMode || form.type || 'Walk-in'),
    'Status': form.status || 'N/A',
    'Remarks': form.remarks || 'None',
    'Referrer': form.referredBy || form.referral || 'Self',
    'Concerns': getConcernText(form)
  }));
};

// Helper function to format date for CSV
function formatDate(dateValue) {
  if (!dateValue) return 'N/A';

  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'N/A';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'N/A';
  }
}