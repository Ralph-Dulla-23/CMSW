import React, { useState, useEffect } from 'react';
import AdminNavbar from '../ui/adminnavbar';
import { getCompletedInterviewForms } from '../../firebase/firestoreService';
import { format, parseISO } from 'date-fns';

function History() {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the specialized function to get only completed forms
      const result = await getCompletedInterviewForms();
      
      if (!result.success) {
        setError(result.error || "Failed to fetch session history");
        return;
      }
      
      // Enhanced sorting logic to handle different date fields
      const sortedForms = result.forms.sort((a, b) => {
        // Try different date fields in order of preference
        const getDateValue = (form) => {
          // First try updatedAt (when the form was last updated)
          if (form.updatedAt) return new Date(form.updatedAt);
          // Then try submissionDate
          if (form.submissionDate) return new Date(form.submissionDate);
          // Then try dateTime
          if (form.dateTime) return new Date(form.dateTime);
          // Then try scheduledDate
          if (form.scheduledDate) return new Date(form.scheduledDate);
          // Then try selectedDate
          if (form.selectedDate) return new Date(form.selectedDate);
          // Default to epoch (oldest possible date)
          return new Date(0);
        };
        
        const dateA = getDateValue(a);
        const dateB = getDateValue(b);
        
        // Sort descending (newest first)
        return dateB - dateA;
      });
      
      setSessions(sortedForms);
      console.log("History sessions loaded:", sortedForms.length);
      
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setError("Failed to load session history: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedStudent(null);
    setIsModalOpen(false);
  };

  const getFilteredSessions = () => {
    return sessions.filter(session => {
      // Filter by search term - check all possible name fields
      const matchesSearch = 
        (session.studentName && session.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (session.fullName && session.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (session.name && session.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (session.courseYearSection && session.courseYearSection.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (session.college && session.college.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (session.referredBy && session.referredBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (session.referral && session.referral.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by remarks instead of status
      const matchesStatus = filterStatus === 'All' || session.remarks === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  };

  // Updated to match the same logic as in SubmittedFormsManagement
  const getSessionType = (session) => {
    if (session.isReferral === true) return "Referral";
    return session.selectedMode || session.type || "Walk-in";
  };

  // Updated to match the same logic as in SubmittedFormsManagement
  const getReferralSource = (session) => {
    if (session.isReferral === true) return session.referredBy || session.referral || "Faculty";
    return session.referral || "Self";
  };

  // Get student name consistently
  const getStudentName = (session) => {
    return session.studentName || session.fullName || session.name || "Student";
  };

  // Updated to extract course and year consistently with other components
  const extractCourseAndYearSection = (session) => {
    // If this is a mobile submission
    if (session.college && session.year) {
      return {
        course: session.college,
        yearSection: `Year ${session.year}${session.section ? ` Section ${session.section}` : ''}`
      };
    }
    
    // For legacy submissions
    const courseYearSection = session.courseYearSection || '';
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

  // Format concerns - updated to handle all possible data structures
  const formatConcerns = (session) => {
    const concerns = {
      personal: [],
      interpersonal: [],
      academic: [],
      family: [],
      grief: []
    };
    
    // Handle direct academic concerns structure
    if (session.academics) {
      console.log("Processing direct academics object:", session.academics);
      const academicConcerns = [];
      
      if (typeof session.academics === 'object') {
        if (session.academics.difficultyUnderstanding) academicConcerns.push('Difficulty understanding lessons');
        if (session.academics.notPrepared) academicConcerns.push('Not prepared/motivated to study');
        if (session.academics.overlyWorried) academicConcerns.push('Overly worried about academic performance');
        if (session.academics.problemBeingOnTime) academicConcerns.push('Problem being on time for class');
        if (session.academics.notHappyWithCourse) academicConcerns.push('Not happy with course');
        if (session.academics.issueWithTeacher) academicConcerns.push('Issues with teacher/professor');
        if (session.academics.homesickness) academicConcerns.push('Homesickness affecting studies');
        if (session.academics.academicOthers && session.academics.academicOthers !== "sa") {
          academicConcerns.push(`Other: ${session.academics.academicOthers}`);
        }
      }
      
      concerns.academic = academicConcerns.length > 0 ? academicConcerns : concerns.academic;
    }
    
    // Handle direct personal concerns structure
    if (session.personal) {
      console.log("Processing direct personal object:", session.personal);
      const personalConcerns = [];
      
      if (typeof session.personal === 'object') {
        if (session.personal.confident) personalConcerns.push('Lack of confidence/self-esteem');
        if (session.personal.decision) personalConcerns.push('Difficulty making decisions');
        if (session.personal.sleeping) personalConcerns.push('Problems with sleeping');
        if (session.personal.mood) personalConcerns.push('Unstable mood');
        if (session.personal.stress) personalConcerns.push('Stress management issues');
        if (session.personal.emotion) personalConcerns.push('Emotional regulation difficulties');
        if (session.personal.time) personalConcerns.push('Time management issues');
        if (session.personal.worry) personalConcerns.push('Excessive worry/anxiety');
        if (session.personal.selfHarm) personalConcerns.push('Self-harm thoughts or behaviors');
        if (session.personal.suicide) personalConcerns.push('Suicidal thoughts');
        if (session.personal.disorder && session.personal.disorder !== "sa") {
          personalConcerns.push(`Mental health concerns: ${session.personal.disorder}`);
        }
        if (session.personal.drug && session.personal.drug !== "sa") {
          personalConcerns.push(`Substance use concerns: ${session.personal.drug}`);
        }
        if (session.personal.usage && session.personal.usage !== "asd") {
          personalConcerns.push(`Usage concerns: ${session.personal.usage}`);
        }
        
        // Process abuse data if present
        if (session.personal.abuse) {
          const abuseTypes = [];
          if (session.personal.abuse.physical) abuseTypes.push('physical');
          if (session.personal.abuse.emotional) abuseTypes.push('emotional');
          if (session.personal.abuse.verbal) abuseTypes.push('verbal');
          if (session.personal.abuse.psychological) abuseTypes.push('psychological');
          if (session.personal.abuse.sexual) abuseTypes.push('sexual');
          
          if (abuseTypes.length > 0) {
            personalConcerns.push(`Abuse (${abuseTypes.join(', ')})`);
          }
        }
      }
      
      concerns.personal = personalConcerns.length > 0 ? personalConcerns : concerns.personal;
    }
    
    // Handle direct interpersonal concerns structure
    if (session.interpersonal) {
      console.log("Processing direct interpersonal object:", session.interpersonal);
      const interpersonalConcerns = [];
      
      if (typeof session.interpersonal === 'object') {
        if (session.interpersonal.isBullied) interpersonalConcerns.push('Being bullied');
        if (session.interpersonal.cannotHandlePressure) interpersonalConcerns.push('Cannot handle peer pressure');
        if (session.interpersonal.difficultyGettingAlong) interpersonalConcerns.push('Difficulty getting along with others');
        if (session.interpersonal.cannotExpressFeelings) interpersonalConcerns.push('Difficulty expressing feelings to others');
        if (session.interpersonal.discrimination && session.interpersonal.discrimination !== "sa") {
          interpersonalConcerns.push(`Experiencing discrimination: ${session.interpersonal.discrimination}`);
        }
      }
      
      concerns.interpersonal = interpersonalConcerns.length > 0 ? interpersonalConcerns : concerns.interpersonal;
    }
    
    // Handle direct family concerns structure
    if (session.family) {
      console.log("Processing direct family object:", session.family);
      const familyConcerns = [];
      
      if (typeof session.family === 'object') {
        if (session.family.hardTimeWithParents) familyConcerns.push('Hard time dealing with parents/guardians');
        if (session.family.familyOpeningUp && session.family.familyOpeningUp !== "sa") {
          familyConcerns.push(`Difficulty opening up to family: ${session.family.familyOpeningUp}`);
        }
        if (session.family.familyFinancialConcern) familyConcerns.push('Family financial concerns');
        if (session.family.frequentArguments) familyConcerns.push('Frequent arguments with family');
        if (session.family.cannotAcceptSeparation) familyConcerns.push('Difficulty accepting parental separation');
        if (session.family.familyGenderPreference) familyConcerns.push('Family gender preference issues');
        if (session.family.familyMemberIllness) familyConcerns.push('Family member illness');
        
        // Process violence data if present
        if (session.family.violence) {
          const violenceTypes = [];
          if (session.family.violence.physical) violenceTypes.push('physical');
          if (session.family.violence.emotional) violenceTypes.push('emotional');
          if (session.family.violence.verbal) violenceTypes.push('verbal');
          if (session.family.violence.psychological) violenceTypes.push('psychological');
          
          if (violenceTypes.length > 0) {
            familyConcerns.push(`Family violence (${violenceTypes.join(', ')})`);
          }
        }
      }
      
      concerns.family = familyConcerns.length > 0 ? familyConcerns : concerns.family;
    }
    
    // Handle direct grief/bereavement concerns structure
    if (session.griefBereavement) {
      console.log("Processing direct griefBereavement object:", session.griefBereavement);
      const griefConcerns = [];
      
      if (typeof session.griefBereavement === 'object') {
        if (session.griefBereavement.griefExperience && session.griefBereavement.griefExperience !== "sa") {
          griefConcerns.push(`Grief experience: ${session.griefBereavement.griefExperience}`);
        }
        if (session.griefBereavement.grievingDeathOf && session.griefBereavement.grievingDeathOf !== "sa") {
          griefConcerns.push(`Grieving death of: ${session.griefBereavement.grievingDeathOf}`);
        }
      }
      
      concerns.grief = griefConcerns.length > 0 ? griefConcerns : concerns.grief;
    }
    
    // Handle faculty referral format
    if (session.concerns) {
      console.log("Processing concerns object:", session.concerns);
      if (session.concerns.personal && Array.isArray(session.concerns.personal)) {
        concerns.personal = concerns.personal.length > 0 ? concerns.personal : session.concerns.personal;
      }
      if (session.concerns.academic && Array.isArray(session.concerns.academic)) {
        concerns.academic = concerns.academic.length > 0 ? concerns.academic : session.concerns.academic;
      }
    }
    
    // Handle student form format
    if (session.areasOfConcern) {
      console.log("Processing areasOfConcern object:", session.areasOfConcern);
      if (session.areasOfConcern.personal && Array.isArray(session.areasOfConcern.personal)) {
        concerns.personal = concerns.personal.length > 0 ? concerns.personal : session.areasOfConcern.personal;
      }
      if (session.areasOfConcern.interpersonal && Array.isArray(session.areasOfConcern.interpersonal)) {
        concerns.interpersonal = concerns.interpersonal.length > 0 ? concerns.interpersonal : session.areasOfConcern.interpersonal;
      }
      if (session.areasOfConcern.academic && Array.isArray(session.areasOfConcern.academic)) {
        concerns.academic = concerns.academic.length > 0 ? concerns.academic : session.areasOfConcern.academic;
      }
      if (session.areasOfConcern.family && Array.isArray(session.areasOfConcern.family)) {
        concerns.family = concerns.family.length > 0 ? concerns.family : session.areasOfConcern.family;
      }
    }
    
    // Process referral-specific concerns
    if (Array.isArray(session.academicConcerns) && session.academicConcerns.length > 0) {
      concerns.academic = concerns.academic.length > 0 ? concerns.academic : session.academicConcerns;
    }
    
    if (Array.isArray(session.personalConcerns) && session.personalConcerns.length > 0) {
      concerns.personal = concerns.personal.length > 0 ? concerns.personal : session.personalConcerns;
    }
    
    return concerns;
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'Attended': return 'bg-green-100 text-green-800';
      case 'No Show': return 'bg-yellow-100 text-yellow-800';
      case 'No Response': return 'bg-orange-100 text-orange-800';
      case 'Follow up': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      
      return format(date, "MMMM do, yyyy");
    } catch (e) {
      return "N/A";
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      
      return format(date, "h:mm a");
    } catch (e) {
      return "N/A";
    }
  };

  // Updated status options to use remarks values
  const statusOptions = [
    'All',
    'Attended',
    'No Show',
    'No Response',
    'Follow up'
  ];

  const filteredSessions = getFilteredSessions();

  return (
    <div className="bg-white min-h-screen">
      <AdminNavbar />

      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Session History</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search by name, course, or referrer..."
              className="w-full p-2 border rounded-lg pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 absolute left-3 top-3 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>
          
          <div className="flex-shrink-0">
            <select
              className="p-2 border rounded-lg w-full md:w-auto"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          
          <button
            className="bg-[#3A0323] text-white px-4 py-2 rounded-lg flex-shrink-0"
            onClick={fetchSessions}
          >
            Refresh
          </button>
        </div>
        
        {loading ? (
          <div className="bg-white shadow-md rounded-lg p-8 flex justify-center">
            <p>Loading session history...</p>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {searchTerm || filterStatus !== 'All' ? 
                  "No sessions match your search criteria" : 
                  "No session history available"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-[#3A0323] border-b text-white">
                    <tr>
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Course</th>
                      <th className="text-left py-3 px-4">Year</th>
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-left py-3 px-4">Referral</th>
                      <th className="text-left py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map((session, index) => {
                      const { course, yearSection } = extractCourseAndYearSection(session);
                      return (
                        <tr
                          key={`${session.id}-${index}`}
                          className="border-b cursor-pointer hover:bg-gray-200"
                          onClick={() => openModal(session)}
                        >
                          <td className="py-3 px-4">{getStudentName(session)}</td>
                          <td className="py-3 px-4">{session.college || course}</td>
                          <td className="py-3 px-4">{session.year ? `Year ${session.year}${session.section ? ` Section ${session.section}` : ''}` : yearSection}</td>
                          <td className="py-3 px-4">{getSessionType(session)}</td>
                          <td className="py-3 px-4">{getReferralSource(session)}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(session.remarks || 'None')}`}>
                              {session.remarks || "None"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-11/12 max-w-4xl rounded-lg shadow-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h1 className="text-2xl font-bold mb-4 text-[#3A0323]">Session Details</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p><strong>Mode of Counseling:</strong> {getSessionType(selectedStudent)}</p>
                <p><strong>Full name:</strong> {getStudentName(selectedStudent)}</p>
                <p><strong>Email Address:</strong> {selectedStudent.email || "N/A"}</p>
                <p><strong>College Department & Course & Year:</strong> {
                  // Prioritize directly stored college/year/section
                  selectedStudent.college ? 
                    `${selectedStudent.college}${selectedStudent.year ? 
                      ` - Year ${selectedStudent.year}${selectedStudent.section ? ` Section ${selectedStudent.section}` : ''}` : 
                      ''}` : 
                    // Fall back to courseYearSection
                    selectedStudent.courseYearSection || "N/A"
                }</p>
                
              </div>
              
              <div>
                <p><strong>ID:</strong> {selectedStudent.studentId || selectedStudent.uicId || "N/A"}</p>
                <p><strong>Date of Birth:</strong> {formatDate(selectedStudent.dateOfBirth || selectedStudent.dob) || "N/A"}</p>
                <p><strong>Age/Sex:</strong> {
                  selectedStudent.ageSex || 
                  (selectedStudent.age && selectedStudent.sex ? 
                    `${selectedStudent.age} / ${selectedStudent.sex}` : 
                    (selectedStudent.age ? `${selectedStudent.age} / Unknown` : "N/A"))
                }</p>
                <p><strong>Contact No.:</strong> {selectedStudent.contactNo || selectedStudent.contact || "N/A"}</p>
                <p><strong>Present Address:</strong> {selectedStudent.presentAddress || selectedStudent.address || "N/A"}</p>
                <p><strong>Emergency contact:</strong> {
                  selectedStudent.emergencyContactPerson && selectedStudent.emergencyContactNo ? 
                    `${selectedStudent.emergencyContactPerson} - ${selectedStudent.emergencyContactNo}` : 
                    (selectedStudent.emergencyContact ? 
                      `${selectedStudent.emergencyContact}${selectedStudent.emergencyContactNo ? ` - ${selectedStudent.emergencyContactNo}` : ''}` : 
                      "N/A")
                }</p>
                <p><strong>Date:</strong> {
                  // Try different date fields
                  selectedStudent.scheduledDate ? formatDate(selectedStudent.scheduledDate) :
                  selectedStudent.selectedDate ? formatDate(selectedStudent.selectedDate) :
                  selectedStudent.date ? formatDate(selectedStudent.date) :
                  selectedStudent.submissionDate ? formatDate(selectedStudent.submissionDate) :
                  selectedStudent.dateTime ? formatDate(selectedStudent.dateTime) :
                  "N/A"
                }</p>
                <p><strong>Time:</strong> {
                  // Try different time fields
                  selectedStudent.scheduledTime ? selectedStudent.scheduledTime :
                  selectedStudent.selectedTime ? selectedStudent.selectedTime :
                  selectedStudent.time ? selectedStudent.time :
                  (selectedStudent.submissionDate ? formatTime(selectedStudent.submissionDate) :
                  selectedStudent.dateTime ? formatTime(selectedStudent.dateTime) :
                  "N/A")
                }</p>
              </div>
            </div>
                  
            <div className="border-t pt-4">
              <h2 className="text-xl font-bold mb-2 text-[#3A0323]">Areas of Concern</h2>
              
              {/* Format and display concerns */}
              {(() => {
                const concerns = formatConcerns(selectedStudent);
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold mt-2">Personal</h3>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        {concerns.personal.length > 0 ? (
                          <ul className="list-disc pl-5">
                            {concerns.personal.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 italic">None specified</p>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold mt-4">Interpersonal</h3>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        {concerns.interpersonal.length > 0 ? (
                          <ul className="list-disc pl-5">
                            {concerns.interpersonal.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 italic">None specified</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mt-2">Academic</h3>
                      <div className="bg-amber-50 p-4 rounded-lg">
                        {concerns.academic.length > 0 ? (
                          <ul className="list-disc pl-5">
                            {concerns.academic.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 italic">None specified</p>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold mt-4">Family</h3>
                      <div className="bg-green-50 p-4 rounded-lg">
                        {concerns.family.length > 0 ? (
                          <ul className="list-disc pl-5">
                            {concerns.family.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 italic">None specified</p>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold mt-4">Grief/Bereavement</h3>
                      <div className="bg-red-50 p-4 rounded-lg">
                        {concerns.grief.length > 0 ? (
                          <ul className="list-disc pl-5">
                            {concerns.grief.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 italic">None specified</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              {/* Getting To Know You section */}
              {selectedStudent.gettingToKnowYou && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-[#3A0323]">Getting To Know You</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {selectedStudent.gettingToKnowYou.q1 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 font-medium">What brings you to counseling today?</p>
                        <p className="mt-1">{selectedStudent.gettingToKnowYou.q1}</p>
                      </div>
                    )}
                    {selectedStudent.gettingToKnowYou.q2 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 font-medium">What have you tried so far to deal with the problem?</p>
                        <p className="mt-1">{selectedStudent.gettingToKnowYou.q2}</p>
                      </div>
                    )}
                    {selectedStudent.gettingToKnowYou.q3 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 font-medium">What are your expectations in counseling?</p>
                        <p className="mt-1">{selectedStudent.gettingToKnowYou.q3}</p>
                      </div>
                    )}
                    {selectedStudent.gettingToKnowYou.q4 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 font-medium">What are your strengths?</p>
                        <p className="mt-1">{selectedStudent.gettingToKnowYou.q4}</p>
                      </div>
                    )}
                    {selectedStudent.gettingToKnowYou.q5 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 font-medium">What do you do to cope with stress?</p>
                        <p className="mt-1">{selectedStudent.gettingToKnowYou.q5}</p>
                      </div>
                    )}
                    {selectedStudent.gettingToKnowYou.q6 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 font-medium">What do you enjoy doing?</p>
                        <p className="mt-1">{selectedStudent.gettingToKnowYou.q6}</p>
                      </div>
                    )}
                    {selectedStudent.gettingToKnowYou.q7 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 font-medium">Is there anything else you'd like to share?</p>
                        <p className="mt-1">{selectedStudent.gettingToKnowYou.q7}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Additional details */}
              {selectedStudent.selfDescription && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold">Self Description</h3>
                  <p className="bg-gray-50 p-3 rounded">{selectedStudent.selfDescription}</p>
                </div>
              )}
              
              {selectedStudent.additionalComments && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold">Additional Comments</h3>
                  <p className="bg-gray-50 p-3 rounded">{selectedStudent.additionalComments}</p>
                </div>
              )}
              
              {selectedStudent.observations && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold">Observations</h3>
                  <p className="bg-gray-50 p-3 rounded">{selectedStudent.observations}</p>
                </div>
              )}
              
              {selectedStudent.otherConcerns && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold">Other Concerns</h3>
                  <p className="bg-gray-50 p-3 rounded">{selectedStudent.otherConcerns}</p>
                </div>
              )}
              
              {/* Session Notes */}
              {selectedStudent.sessionNotes && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold">Session Notes</h3>
                  <p className="bg-gray-50 p-3 rounded">{selectedStudent.sessionNotes}</p>
                </div>
              )}
              
              <div className="mt-6 bg-gray-100 p-4 rounded-lg">
                <h3 className="text-lg font-semibold">Session Status</h3>
                <div className="flex items-center mt-2">
                  <strong className="mr-2">Status:</strong> 
                  <span className={`px-2 py-1 rounded-full ${getStatusClass(selectedStudent.remarks || 'None')}`}>
                    {selectedStudent.remarks || "None"}
                  </span>
                </div>
                <p className="mt-1"><strong>Last Updated:</strong> {selectedStudent.updatedAt ? formatDate(selectedStudent.updatedAt) + " at " + formatTime(selectedStudent.updatedAt) : "N/A"}</p>
                
                {selectedStudent.followUpDate && (
                  <p className="mt-2 text-purple-700">
                    <strong>Follow-up Date:</strong> {formatDate(selectedStudent.followUpDate)}
                    {selectedStudent.followUpTime && ` at ${selectedStudent.followUpTime}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default History;