import React, { useState, useEffect } from 'react';
import AdminNavbar from '../ui/adminnavbar';
import { getActiveCounselingForms, updateFormStatus, getReferrals } from '../../firebase/firestoreService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import StudentDetailsModal from '../ui/studentdetailsModal';
import FollowUpScheduler from '../../components/FollowUpSceduler';
import ReferralModal from '../ui/referralModal';

function SubmittedFormsManagement() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [dropdownValues, setDropdownValues] = useState({});
  const [showFollowUpScheduler, setShowFollowUpScheduler] = useState(false);
  const [currentFormId, setCurrentFormId] = useState(null);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState(null);

  // Initial data fetch
  useEffect(() => {
    refreshData();
  }, []);

  // Debug modal state changes
  useEffect(() => {
    console.log("Modal open state changed:", isModalOpen);
    console.log("Selected student:", selectedStudent);
  }, [isModalOpen, selectedStudent]);

  // Comprehensive data refresh function
  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Refreshing all data...");
      
      // Fetch both regular forms and referrals concurrently
      const [formsResult, referralsResult] = await Promise.all([
        getActiveCounselingForms(),
        getReferrals()
      ]);
      
      let allForms = [];
      
      if (formsResult.success) {
        console.log("Regular counseling forms fetched:", formsResult.forms.length);
        allForms = [...formsResult.forms];
      } else {
        console.error("Error fetching regular forms:", formsResult.error);
      }
      
      if (referralsResult.success) {
        console.log("Referrals fetched:", referralsResult.referrals.length);
        allForms = [...allForms, ...referralsResult.referrals];
      } else {
        console.error("Error fetching referrals:", referralsResult.error);
      }
      
      console.log("Total forms for display:", allForms.length);
      
      // Initialize dropdown values
      const initialDropdownValues = {};
      allForms.forEach(form => {
        initialDropdownValues[form.id] = '';
      });
      
      // Update state
      setForms(allForms);
      setDropdownValues(initialDropdownValues);
      
    } catch (error) {
      console.error("Error refreshing data:", error);
      setError("An error occurred while loading data. Please try again.");
      toast.error("Error loading data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to add proper suffix to year number
  const getYearSuffix = (num) => {
    if (num === 1) return '1st';
    if (num === 2) return '2nd';
    if (num === 3) return '3rd';
    if (num >= 4) return `${num}th`;
    return 'Unknown';
  };
  
  // Open referral modal with formatted data
  const openReferralModal = (student) => {
    console.log("Opening referral modal with data:", student);
    
    // If this is a direct referral from the referrals collection, pass it directly
    if (student.isDirectReferral || student.originalData) {
      console.log("Processing direct referral for modal");
      
      // Get the original data if it exists
      const originalData = student.originalData || student;
      
      // Extract the necessary data, ensuring we have all required fields
      const referralData = {
        id: student.id,
        clientName: originalData.clientName || student.name || 'Unknown',
        courseYear: `${originalData.college || 'Unknown'} - Year ${originalData.year || 'Unknown'}${originalData.section ? ` Section ${originalData.section}` : ''}`,
        date: originalData.date || 'Unknown',
        time: originalData.time || 'Unknown',
        referredBy: originalData.referredBy || student.referral || 'Unknown',
        remarks: originalData.remarks || 'None specified',
        otherConcerns: originalData.otherConcerns || 'None specified',
        status: originalData.status || student.status || 'Pending',
        
        // Ensure we have arrays for concerns
        academicConcerns: Array.isArray(originalData.academicConcerns) ? originalData.academicConcerns : ['None'],
        personalConcerns: Array.isArray(originalData.personalConcerns) ? originalData.personalConcerns : ['None'],
      };
      
      console.log("Processed referral data for modal:", referralData);
      setSelectedReferral(referralData);
      setIsReferralModalOpen(true);
      return;
    }
    
    // For regular referrals from counselingForms collection
    console.log("Processing counselingForm referral for modal");
    const formattedReferral = {
      id: student.id,
      clientName: student.name || (student.details?.fullName) || 'Unknown',
      courseYear: student.course ? `${student.course} ${student.year}` : (student.details?.courseYear || 'Unknown'),
      date: student.details?.date || 'Unknown',
      time: student.details?.time || 'Unknown',
      referredBy: student.referral || student.details?.referredBy || 'Unknown',
      remarks: student.remarks || student.details?.referralRemarks || 'None specified',
      otherConcerns: student.otherConcerns || 'None specified',
      status: student.status || 'Pending',
      
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

  // Helper functions for extracting concerns from mobile form data
  const extractAcademicConcerns = (academics, referralAcademicConcerns = null) => {
    // If this is a referral, handle referral-style concerns
    if (referralAcademicConcerns) {
      if (Array.isArray(referralAcademicConcerns)) {
        return referralAcademicConcerns.length > 0 ? referralAcademicConcerns : ['None'];
      } else if (typeof referralAcademicConcerns === 'string' && referralAcademicConcerns.trim() !== '') {
        return [referralAcademicConcerns];
      }
    }
    
    // Handle mobile app style concerns
    if (!academics) return ['None'];
    
    const concerns = [];
    
    if (academics.difficultyUnderstanding) concerns.push('Difficulty Understanding');
    if (academics.homesickness) concerns.push('Homesickness');
    if (academics.issueWithTeacher) concerns.push('Issues With Teacher');
    if (academics.notHappyWithCourse) concerns.push('Not Happy With Course');
    if (academics.notPrepared) concerns.push('Not Prepared');
    if (academics.overlyWorried) concerns.push('Overly Worried');
    if (academics.problemBeingOnTime) concerns.push('Problem Being On Time');
    
    if (academics.academicOthers && academics.academicOthers !== "sa") {
      concerns.push(`Other: ${academics.academicOthers}`);
    }
    
    return concerns.length > 0 ? concerns : ['None'];
  };

  const extractPersonalConcerns = (personal, referralPersonalConcerns = null) => {
    // If this is a referral, handle referral-style concerns
    if (referralPersonalConcerns) {
      if (Array.isArray(referralPersonalConcerns)) {
        return referralPersonalConcerns.length > 0 ? referralPersonalConcerns : ['None'];
      } else if (typeof referralPersonalConcerns === 'string' && referralPersonalConcerns.trim() !== '') {
        return [referralPersonalConcerns];
      }
    }
    
    // Handle mobile app style concerns
    if (!personal) return ['None'];
    
    const concerns = [];
    
    if (personal.confident) concerns.push('Not feeling confident about myself');
    if (personal.decision) concerns.push('Hard time making decisions');
    if (personal.emotion) concerns.push('Difficulty managing emotions');
    if (personal.mood) concerns.push('Unstable mood');
    if (personal.sleeping) concerns.push('Problems with sleeping');
    if (personal.stress) concerns.push('Experiencing high stress');
    if (personal.time) concerns.push('Time management issues');
    if (personal.worry) concerns.push('Excessive worrying');
    if (personal.selfHarm) concerns.push('Self-harm thoughts or behaviors');
    if (personal.suicide) concerns.push('Suicidal thoughts');
    
    if (personal.abuse) {
      if (personal.abuse.emotional) concerns.push('Experienced emotional abuse');
      if (personal.abuse.physical) concerns.push('Experienced physical abuse');
      if (personal.abuse.psychological) concerns.push('Experienced psychological abuse');
      if (personal.abuse.sexual) concerns.push('Experienced sexual abuse');
      if (personal.abuse.verbal) concerns.push('Experienced verbal abuse');
    }
    
    if (personal.disorder && personal.disorder !== "sa") {
      concerns.push(`Mental health condition: ${personal.disorder}`);
    }
    
    if (personal.drug && personal.drug !== "sa") {
      concerns.push(`Substance use: ${personal.drug}`);
    }
    
    if (personal.usage && personal.usage !== "asd") {
      concerns.push(`Usage concerns: ${personal.usage}`);
    }
    
    return concerns.length > 0 ? concerns : ['None'];
  };

  const extractFamilyConcerns = (family) => {
    if (!family) return ['None'];
    
    const concerns = [];
    
    if (family.cannotAcceptSeparation) concerns.push('Cannot accept separation of parents');
    if (family.familyFinancialConcern) concerns.push('Family financial concerns');
    if (family.familyGenderPreference) concerns.push('Family gender preference issues');
    if (family.familyMemberIllness) concerns.push('Family member illness');
    if (family.frequentArguments) concerns.push('Frequent arguments in family');
    if (family.hardTimeWithParents) concerns.push('Hard time with parents/guardian expectations');
    
    if (family.violence) {
      if (family.violence.emotional) concerns.push('Emotional violence in family');
      if (family.violence.physical) concerns.push('Physical violence in family');
      if (family.violence.psychological) concerns.push('Psychological violence in family');
      if (family.violence.verbal) concerns.push('Verbal violence in family');
    }
    
    if (family.familyOpeningUp && family.familyOpeningUp !== "sa") {
      concerns.push(`Family communication issues: ${family.familyOpeningUp}`);
    }
    
    return concerns.length > 0 ? concerns : ['None'];
  };

  const extractInterpersonalConcerns = (interpersonal) => {
    if (!interpersonal) return ['None'];
    
    const concerns = [];
    
    if (interpersonal.cannotExpressFeelings) concerns.push('Cannot express feelings to others');
    if (interpersonal.cannotHandlePressure) concerns.push('Cannot handle peer pressure');
    if (interpersonal.difficultyGettingAlong) concerns.push('Difficulty getting along with others');
    if (interpersonal.isBullied) concerns.push('Being bullied');
    
    if (interpersonal.discrimination && interpersonal.discrimination !== "sa") {
      concerns.push(`Experiencing discrimination: ${interpersonal.discrimination}`);
    }
    
    return concerns.length > 0 ? concerns : ['None'];
  };

  const extractGriefConcerns = (grief) => {
    if (!grief) return ['None'];
    
    const concerns = [];
    
    if (grief.griefExperience && grief.griefExperience !== "sa") {
      concerns.push(`Grief experience: ${grief.griefExperience}`);
    }
    
    if (grief.grievingDeathOf && grief.grievingDeathOf !== "sa") {
      concerns.push(`Grieving death of: ${grief.grievingDeathOf}`);
    }
    
    return concerns.length > 0 ? concerns : ['None'];
  };

  // Helper function to map concern codes to readable text (for legacy forms)
  const mapConcernAreasToText = (concerns, category) => {
    if (!concerns || !Array.isArray(concerns) || concerns.length === 0) {
      return ['None'];
    }

    const mappings = {
      personal: {
        'notConfident': 'I do not feel confident about myself',
        'hardTimeDecisions': 'I have a hard time making decisions',
        'problemSleeping': 'I have a problem with sleeping',
        'moodNotStable': 'I have noticed that my mood is not stable'
      },
      interpersonal: {
        'beingBullied': 'I am being bullied',
        'cannotHandlePeerPressure': 'I cannot handle peer pressure',
        'difficultyGettingAlong': 'I have difficulty getting along with others'
      },
      academic: {
        'overlyWorriedAcademic': 'I am overly worried about my academic performance',
        'notMotivatedStudy': 'I am not motivated to study',
        'difficultyUnderstanding': 'I have difficulty understanding the class lessons'
      },
      family: {
        'hardTimeDealingParents': 'I have a hard time dealing with my parents/guardian\'s expectations and demands',
        'difficultyOpeningUp': 'I have difficulty opening up to family member/s',
        'financialConcerns': 'Our family is having financial concerns'
      }
    };

    return concerns.map(concern => mappings[category][concern] || concern);
  };

  // When Follow-up is selected from dropdown
  const handleFollowUpSelection = (formId) => {
    setCurrentFormId(formId);
    setShowFollowUpScheduler(true);
  };

  // When follow-up is scheduled
  const handleFollowUpScheduled = (date, time) => {
    handleRemarkChange(currentFormId, 'Follow up', date, '', false, time);
    setShowFollowUpScheduler(false);
    setCurrentFormId(null);
  };

  // Helper function to determine department from course code
  const getDepartmentFromCourse = (courseCode) => {
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

  const openModal = (student) => {
    console.log("Opening modal for student:", student);
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedStudent(null);
    setIsModalOpen(false);
  };

  const isValidDate = (date) => {
    return date instanceof Date && !isNaN(date.getTime());
  };

  // Handler for when a remark is selected
  // In SubmittedFormsManagement.js
const handleRemarkChange = async (formId, newRemark, followUpDate = null, sessionNotes = '', isDropdownChangeOnly = false, followUpTime = null) => {
  try {
    console.log("handleRemarkChange called with:", { 
      formId, 
      newRemark, 
      followUpDate, 
      sessionNotes, 
      isDropdownChangeOnly, 
      followUpTime 
    });

    if (isDropdownChangeOnly) {
      setDropdownValues(prev => ({
        ...prev,
        [formId]: newRemark
      }));

      if (newRemark === 'Follow up') {
        handleFollowUpSelection(formId);
      }

      return;
    }

    setUpdatingId(formId);

    // Find the current form
    const currentForm = forms.find(form => form.id === formId);
    if (!currentForm) {
      toast.error("Form not found");
      return;
    }

    // Determine if this is a referral
    const isReferral = currentForm.isReferral === true;
    
    // Determine if this is an initial confirmation
    const isInitialConfirmation = currentForm.status === 'Pending' || !currentForm.status;

    console.log("Processing form:", { 
      id: formId, 
      isReferral,
      isInitialConfirmation, 
      currentStatus: currentForm.status 
    });

    // For initial confirmation
    if (isInitialConfirmation) {
      const additionalData = {
        confirmedAt: new Date().toISOString()
      };

      if (sessionNotes && sessionNotes.trim() !== '') {
        additionalData.sessionNotes = sessionNotes;
      }

      console.log("Confirming appointment with data:", additionalData);
      
      const result = await updateFormStatus(formId, 'Confirmed', 'Confirmed', additionalData);

      if (result.success) {
        toast.success("Appointment confirmed successfully!");
        
        // Update the local state to reflect the change immediately
        setForms(prevForms => 
          prevForms.map(form => 
            form.id === formId 
              ? { 
                  ...form, 
                  status: 'Confirmed', 
                  remarks: 'Confirmed',
                  // Update any other fields that might have changed
                  sessionNotes: sessionNotes || form.sessionNotes,
                  updatedAt: new Date().toISOString()
                } 
              : form
          )
        );
        
        // Close modals
        if (isModalOpen) closeModal();
        if (isReferralModalOpen) setIsReferralModalOpen(false);
      } else {
        toast.error("Failed to confirm appointment: " + (result.error || "Unknown error"));
      }
      return;
    }

    // For follow-up scheduling
    if (newRemark === 'Follow up') {
      if (!followUpDate || !followUpTime) {
        toast.error("Please select both follow-up date and time");
        return;
      }

      const additionalData = {
        followUpDate,
        followUpTime,
        followUpDateTime: `${followUpDate}T${followUpTime}`,
        status: 'Scheduled',
        remarks: newRemark,
        isFollowUp: true
      };

      if (sessionNotes && sessionNotes.trim() !== '') {
        additionalData.sessionNotes = sessionNotes;
      }

      console.log("Scheduling follow-up with data:", additionalData);
      
      const result = await updateFormStatus(formId, 'Scheduled', newRemark, additionalData);

      if (result.success) {
        toast.success(`Follow-up scheduled for ${followUpDate} at ${followUpTime}`);
        
        // Update the local state immediately
        setForms(prevForms => 
          prevForms.map(form => 
            form.id === formId 
              ? { 
                  ...form, 
                  status: 'Scheduled', 
                  remarks: 'Follow up',
                  followUpDate,
                  followUpTime,
                  sessionNotes: sessionNotes || form.sessionNotes,
                  updatedAt: new Date().toISOString()
                } 
              : form
          )
        );
        
        // Close modals
        if (isModalOpen) closeModal();
        if (isReferralModalOpen) setIsReferralModalOpen(false);
      } else {
        toast.error("Failed to schedule follow-up: " + (result.error || "Unknown error"));
      }
      return;
    }

    // For other status updates (Attended, No Show, etc.)
    if (['Attended', 'No Show', 'No Response', 'Terminated'].includes(newRemark)) {
      const additionalData = {
        status: 'Completed',
        completedAt: new Date().toISOString()
      };
      
      if (sessionNotes && sessionNotes.trim() !== '') {
        additionalData.sessionNotes = sessionNotes;
      }

      console.log("Completing session with remark:", newRemark, "and data:", additionalData);
      
      const result = await updateFormStatus(formId, 'Completed', newRemark, additionalData);

      if (result.success) {
        toast.success(`Session moved to history as ${newRemark}`);
        
        // Remove from local state
        setForms(prevForms => prevForms.filter(form => form.id !== formId));
        
        // Close modals
        if (isModalOpen) closeModal();
        if (isReferralModalOpen) setIsReferralModalOpen(false);
      } else {
        toast.error("Failed to update status: " + (result.error || "Unknown error"));
      }
    }
  } catch (error) {
    console.error("Error in handleRemarkChange:", error);
    toast.error("An error occurred: " + error.message);
  } finally {
    setUpdatingId(null);
  }
};

  // Filter forms by referral type
  const nonReferralForms = forms.filter(form => !form.isReferral);
  const referralForms = forms.filter(form => form.isReferral);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <AdminNavbar />
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <AdminNavbar />
      
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

      {error && (
        <div className="max-w-8xl mx-auto mt-4 px-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
            <button 
              onClick={refreshData}
              className="underline ml-2"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
  
      <div className="max-w-8xl mx-auto px-6 pt-12">
        <h1 className="text-2xl font-bold mb-6">Non-Referral</h1>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full bg-white">
            <thead className="bg-[#3A0323] border-b text-white">
              <tr>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Course</th>
                <th className="text-left py-3 px-4">Year</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Referral</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {nonReferralForms.length > 0 ? (
                nonReferralForms.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b hover:bg-gray-200 cursor-pointer"
                    onClick={() => openModal(student)}
                  >
                    <td className="py-3 px-4">{student.name}</td>
                    <td className="py-3 px-4">{student.course}</td>
                    <td className="py-3 px-4">{student.year}</td>
                    <td className="py-3 px-4">{student.type}</td>
                    <td className="py-3 px-4">{student.referral}</td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={dropdownValues[student.id] || ''}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.value) {
                            setDropdownValues(prev => ({
                              ...prev,
                              [student.id]: e.target.value
                            }));
                            handleRemarkChange(student.id, e.target.value, null, null, true);
                          }
                        }}
                        className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        disabled={updatingId === student.id}
                      >
                        <option value="">Select Remarks</option>
                        <option value="Attended">Attended</option>
                        <option value="No Show">No Show</option>
                        <option value="No Response">No Response</option>
                        <option value="Terminated">Terminated</option>
                        <option value="Follow up">Follow-up</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-gray-500">
                    No non-referral submissions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-6 pt-12">
        <h1 className="text-2xl font-bold mb-6">Referral</h1>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full bg-white">
            <thead className="bg-[#3A0323] border-b text-white">
              <tr>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Course</th>
                <th className="text-left py-3 px-4">Year</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Referral</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {referralForms.length > 0 ? (
                referralForms.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b hover:bg-gray-200 cursor-pointer"
                    onClick={() => openReferralModal(student)}
                  >
                    <td className="py-3 px-4">{student.name}</td>
                    <td className="py-3 px-4">{student.course}</td>
                    <td className="py-3 px-4">{student.year}</td>
                    <td className="py-3 px-4">{student.type}</td>
                    <td className="py-3 px-4">{student.referral}</td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={dropdownValues[student.id] || ''}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.value) {
                            setDropdownValues(prev => ({
                              ...prev,
                              [student.id]: e.target.value
                            }));
                            handleRemarkChange(student.id, e.target.value, null, null, true);
                          }
                        }}
                        className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        disabled={updatingId === student.id}
                      >
                        <option value="">Select Remarks</option>
                        <option value="Attended">Attended</option>
                        <option value="No Show">No Show</option>
                        <option value="No Response">No Response</option>
                        <option value="Terminated">Terminated</option>
                        <option value="Follow up">Follow-up</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-gray-500">
                    No referral submissions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Student Details Modal */}
      {isModalOpen && selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          onClose={closeModal}
          handleRemarkChange={(formId, remark, followUpDate, sessionNotes, isDropdownChangeOnly, followUpTime) => {
            // Make sure all parameters are passed through
            handleRemarkChange(formId, remark, followUpDate, sessionNotes, isDropdownChangeOnly, followUpTime);
          }}
          updatingId={updatingId}
          dropdownValue={dropdownValues[selectedStudent.id] || ''}
        />
      )}
      
      {/* Referral Modal */}
      {isReferralModalOpen && selectedReferral && (
  <ReferralModal 
    referral={selectedReferral} 
    onClose={() => setIsReferralModalOpen(false)} 
    handleRemarkChange={(formId, remark, followUpDate, sessionNotes, isDropdownChangeOnly, followUpTime) => {
      handleRemarkChange(formId, remark, followUpDate, sessionNotes, isDropdownChangeOnly, followUpTime);
    }}
    updatingId={updatingId}
    dropdownValue={dropdownValues[selectedReferral.id] || ''}
    isValidDate={isValidDate}  // Pass the function as a prop
  />
)}


      {/* Follow-up Scheduler Modal */}
      {showFollowUpScheduler && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-96 rounded-lg shadow-lg p-6 relative">
            <button
              onClick={() => setShowFollowUpScheduler(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-xl font-bold mb-4">Schedule Follow-up</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
              <input
                type="date"
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFollowUpDate(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Time</label>
              <input
                type="time"
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                onChange={(e) => setFollowUpTime(e.target.value)}
                required
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  if (followUpDate && followUpTime) {
                    handleFollowUpScheduled(followUpDate, followUpTime);
                  } else {
                    toast.error("Please select both date and time");
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Schedule Follow-up
              </button>
              <button
                onClick={() => setShowFollowUpScheduler(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubmittedFormsManagement;