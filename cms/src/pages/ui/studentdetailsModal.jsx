import React, { useState } from 'react';

function StudentDetailsModal({ 
  student, 
  onClose, 
  handleRemarkChange, 
  updatingId,
  dropdownValue
}) {
  const [sessionNotes, setSessionNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');

  // Determine if we're in initial confirmation, post-session update, or follow-up stage
  const isInitialConfirmation = student.status === 'Pending';
  const isPostSession = student.status === 'Confirmed' || student.status === 'Rescheduled';
  const isSchedulingFollowUp = dropdownValue === 'Follow up';
  const isReferral = student.isReferral === true;
  const isReturningStudent = student.isReturningStudent === true;
  const fullName = student.details?.fullName || student.name || 'Not specified';

  // Format course/year the same way as in ReferralModal
  const courseYear = student.details?.courseYear || 'Not specified';

  // Get department
  const department = student.college || student.details?.department || 'Not specified';
                      
  // Get other fields
  const uicId = student.details?.id || 'Not specified';
  const email = student.details?.email || 'Not specified';
  const ageSex = student.details?.ageSex || 'Not specified';
  const contact = student.details?.contact || 'Not specified';
  const dob = student.details?.dob || 'Not specified';
  const address = student.details?.address || 'Not specified';
  const emergencyContact = student.details?.emergencyContact || 'Not specified';
  const appointmentDate = student.details?.date || 'Not specified';
  const appointmentTime = student.details?.time || 'Not specified';
  const counselingMode = student.details?.mode || 'Not specified';
  
  // Helper function for status color
  const getStatusClass = (status) => {
    switch(status) {
      case 'Attended': return 'bg-green-100 text-green-800';
      case 'No Show': return 'bg-yellow-100 text-yellow-800';
      case 'No Response': return 'bg-orange-100 text-orange-800';
      
      case 'Follow up': return 'bg-purple-100 text-purple-800';
      case 'Confirmed': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-gray-100 text-gray-800';
      case 'Rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800'; // Default
    }
  };

  // Format course and year properly
  

  // Format academic concerns
  const formatAcademicConcerns = () => {
    const concerns = [];
    
    // Check if we have the modern structure with academics map
    if (student.academics) {
      if (student.academics.difficultyUnderstanding) concerns.push('Difficulty understanding lessons');
      if (student.academics.notPrepared) concerns.push('Not prepared/motivated to study');
      if (student.academics.overlyWorried) concerns.push('Overly worried about academic performance');
      if (student.academics.problemBeingOnTime) concerns.push('Problem being on time for class');
      if (student.academics.notHappyWithCourse) concerns.push('Not happy with course');
      if (student.academics.issueWithTeacher) concerns.push('Issues with teacher/professor');
      if (student.academics.homesickness) concerns.push('Homesickness affecting studies');
      if (student.academics.academicOthers) concerns.push(`Other: ${student.academics.academicOthers}`);
    }
    
    // Check if we have it in details.academics
    else if (student.details && student.details.academics) {
      // If it's already an array of strings, return it
      if (Array.isArray(student.details.academics) && student.details.academics.length > 0 && typeof student.details.academics[0] === 'string') {
        return student.details.academics;
      }
      
      // If it's a map like the above
      const academicsMap = student.details.academics;
      if (academicsMap.difficultyUnderstanding) concerns.push('Difficulty understanding lessons');
      if (academicsMap.notPrepared) concerns.push('Not prepared/motivated to study');
      if (academicsMap.overlyWorried) concerns.push('Overly worried about academic performance');
      if (academicsMap.problemBeingOnTime) concerns.push('Problem being on time for class');
      if (academicsMap.notHappyWithCourse) concerns.push('Not happy with course');
      if (academicsMap.issueWithTeacher) concerns.push('Issues with teacher/professor');
      if (academicsMap.homesickness) concerns.push('Homesickness affecting studies');
      if (academicsMap.academicOthers) concerns.push(`Other: ${academicsMap.academicOthers}`);
    }
    
    return concerns.length > 0 ? concerns : ['None'];
  };

  // Format personal concerns
  const formatPersonalConcerns = () => {
    const concerns = [];
    
    // Check if we have the modern structure with personal map
    if (student.personal) {
      if (student.personal.confident) concerns.push('Lack of confidence/self-esteem');
      if (student.personal.decision) concerns.push('Difficulty making decisions');
      if (student.personal.sleeping) concerns.push('Problems with sleeping');
      if (student.personal.mood) concerns.push('Unstable mood');
      if (student.personal.stress) concerns.push('Stress management issues');
      if (student.personal.emotion) concerns.push('Emotional regulation difficulties');
      if (student.personal.time) concerns.push('Time management issues');
      if (student.personal.worry) concerns.push('Excessive worry/anxiety');
      if (student.personal.selfHarm) concerns.push('Self-harm thoughts or behaviors');
      if (student.personal.suicide) concerns.push('Suicidal thoughts');
      if (student.personal.disorder) concerns.push(`Mental health concerns: ${student.personal.disorder}`);
      if (student.personal.drug) concerns.push(`Substance use concerns: ${student.personal.drug}`);
      if (student.personal.usage) concerns.push(`Substance usage details: ${student.personal.usage}`);
      
      // Check for abuse
      if (student.personal.abuse) {
        const abuseTypes = [];
        if (student.personal.abuse.physical) abuseTypes.push('physical');
        if (student.personal.abuse.emotional) abuseTypes.push('emotional');
        if (student.personal.abuse.verbal) abuseTypes.push('verbal');
        if (student.personal.abuse.psychological) abuseTypes.push('psychological');
        if (student.personal.abuse.sexual) abuseTypes.push('sexual');
        
        if (abuseTypes.length > 0) {
          concerns.push(`Abuse (${abuseTypes.join(', ')})`);
        }
      }
    }
    
    // Check if we have it in details.personal
    else if (student.details && student.details.personal) {
      // If it's already an array of strings, return it
      if (Array.isArray(student.details.personal) && student.details.personal.length > 0 && typeof student.details.personal[0] === 'string') {
        return student.details.personal;
      }
      
      // If it's a map like the above
      const personalMap = student.details.personal;
      // Add similar processing as above
      if (personalMap.confident) concerns.push('Lack of confidence/self-esteem');
      if (personalMap.decision) concerns.push('Difficulty making decisions');
      // Add more as needed
    }
    
    return concerns.length > 0 ? concerns : ['None'];
  };

  // Format family concerns
  const formatFamilyConcerns = () => {
    const concerns = [];
    
    // Check if we have the modern structure with family map
    if (student.family) {
      if (student.family.hardTimeWithParents) concerns.push('Hard time dealing with parents/guardians');
      if (student.family.familyOpeningUp) concerns.push(`Difficulty opening up to family: ${student.family.familyOpeningUp}`);
      if (student.family.familyFinancialConcern) concerns.push('Family financial concerns');
      if (student.family.frequentArguments) concerns.push('Frequent arguments with family');
      if (student.family.cannotAcceptSeparation) concerns.push('Difficulty accepting parental separation');
      if (student.family.familyGenderPreference) concerns.push('Family gender preference issues');
      if (student.family.familyMemberIllness) concerns.push('Family member illness');
      
      // Check for violence
      if (student.family.violence) {
        const violenceTypes = [];
        if (student.family.violence.physical) violenceTypes.push('physical');
        if (student.family.violence.emotional) violenceTypes.push('emotional');
        if (student.family.violence.verbal) violenceTypes.push('verbal');
        if (student.family.violence.psychological) violenceTypes.push('psychological');
        
        if (violenceTypes.length > 0) {
          concerns.push(`Family violence (${violenceTypes.join(', ')})`);
        }
      }
    }
    
    // Check if we have it in details.family
    else if (student.details && student.details.family) {
      // If it's already an array of strings, return it
      if (Array.isArray(student.details.family) && student.details.family.length > 0 && typeof student.details.family[0] === 'string') {
        return student.details.family;
      }
      
      // If it's a map, process it similarly to above
    }
    
    return concerns.length > 0 ? concerns : ['None'];
  };

  // Format interpersonal concerns
  const formatInterpersonalConcerns = () => {
    const concerns = [];
    
    // Check if we have the modern structure with interpersonal map
    if (student.interpersonal) {
      if (student.interpersonal.isBullied) concerns.push('Being bullied');
      if (student.interpersonal.cannotHandlePressure) concerns.push('Cannot handle peer pressure');
      if (student.interpersonal.difficultyGettingAlong) concerns.push('Difficulty getting along with others');
      if (student.interpersonal.cannotExpressFeelings) concerns.push('Difficulty expressing feelings to others');
      if (student.interpersonal.discrimination) concerns.push(`Experiencing discrimination: ${student.interpersonal.discrimination}`);
    }
    
    // Check if we have it in details.interpersonal
    else if (student.details && student.details.interpersonal) {
      // If it's already an array of strings, return it
      if (Array.isArray(student.details.interpersonal) && student.details.interpersonal.length > 0 && typeof student.details.interpersonal[0] === 'string') {
        return student.details.interpersonal;
      }
      
      // If it's a map, process it similarly to above
    }
    
    return concerns.length > 0 ? concerns : ['None'];
  };

  // Format grief/bereavement concerns
  const formatGriefConcerns = () => {
    const concerns = [];
    
    // Check if we have the modern structure with griefBereavement map
    if (student.griefBereavement) {
      if (student.griefBereavement.griefExperience) concerns.push(`Grief experience: ${student.griefBereavement.griefExperience}`);
      if (student.griefBereavement.grievingDeathOf) concerns.push(`Grieving death of: ${student.griefBereavement.grievingDeathOf}`);
    }
    
    // Check if we have it in details.grief
    else if (student.details && student.details.grief) {
      // If it's already an array of strings, return it
      if (Array.isArray(student.details.grief) && student.details.grief.length > 0 && typeof student.details.grief[0] === 'string') {
        return student.details.grief;
      }
      
      // If it's a map, process it similarly to above
    }
    
    return concerns.length > 0 ? concerns : ['None'];
  };

  // Handle the Accept/Confirm button click
  const handleAccept = () => {
    console.log("handleAccept called with dropdownValue:", dropdownValue);
    console.log("Follow-up date at accept:", followUpDate); 
    console.log("Follow-up time at accept:", followUpTime);
    console.log("Session notes to be saved:", sessionNotes);
    
    // For initial confirmation (when status is Pending)
    if (isInitialConfirmation) {
      // Call handleRemarkChange with 'Confirmed' status and session notes
      handleRemarkChange(student.id, 'Confirmed', null, sessionNotes, false);
      
      // No need to add notification code here as it's handled in handleRemarkChange
      return;
    }
    
    // For Follow up, make sure there's a date and time selected
    if (dropdownValue === 'Follow up') {
      if (!followUpDate) {
        alert('Please select a follow-up date');
        return;
      }
      if (!followUpTime) {
        alert('Please select a follow-up time');
        return;
      }
      
      // Call the handleRemarkChange function with the student ID, remark, date, time and notes
      handleRemarkChange(student.id, dropdownValue, followUpDate, sessionNotes, false, followUpTime);
      
      // No need to add notification code here as it's handled in handleRemarkChange
    } else if (dropdownValue) {
      // For other remarks, just pass the basic parameters
      handleRemarkChange(student.id, dropdownValue, null, sessionNotes, false);
      
      // No need to add notification code here as it's handled in handleRemarkChange
    } else {
      // If no dropdown value is selected, show an error
      alert('Please select a status update option');
    }
  };

  // Get the appropriate button text based on the stage
  const getButtonText = () => {
    if (isInitialConfirmation) return "Confirm Appointment";
    if (isSchedulingFollowUp) return "Schedule Follow-up";
    return "Update Status";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-11/12 max-w-2xl rounded-lg shadow-lg p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Close</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Header */}
        <div className="border-b pb-4 mb-4">
          <h2 className="text-xl font-bold text-[#3A0323]">
            {isReferral ? "Referral Information" : "Student Information"}
          </h2>
          
          {isReturningStudent && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full inline-block text-sm mt-2">
              Returning Student
            </span>
          )}
          
          {student.status && (
            <span className={`ml-2 px-2 py-1 rounded-full inline-block text-sm ${getStatusClass(student.status)}`}>
              {student.status}
            </span>
          )}
        </div>
        
        {/* Client Information */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-[#3A0323]">Client Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="font-medium">{fullName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Department/Course/Year</p>
              <p className="font-medium">{courseYear}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">UIC ID</p>
              <p className="font-medium">{uicId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Age/Sex</p>
              <p className="font-medium">{ageSex}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Contact No.</p>
              <p className="font-medium">{contact}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date of Birth</p>
              <p className="font-medium">{dob}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Emergency Contact</p>
              <p className="font-medium">{emergencyContact}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Appointment Date</p>
              <p className="font-medium">{appointmentDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Appointment Time</p>
              <p className="font-medium">{appointmentTime}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Mode of Counseling</p>
              <p className="font-medium">{counselingMode}</p>
            </div>
            {isReferral && (
              <div>
                <p className="text-sm text-gray-500">Referred By</p>
                <p className="font-medium">{student.referredBy || student.referral || student.details?.referredBy || 'Not specified'}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Academic Concerns */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-[#3A0323]">Academic Concerns</h3>
          <div className="bg-amber-50 p-4 rounded-lg">
            <ul className="list-disc pl-5 space-y-1">
              {formatAcademicConcerns().map((concern, index) => (
                <li key={index} className="text-gray-800">{concern}</li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Personal Concerns */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-[#3A0323]">Personal/Social Concerns</h3>
          <div className="bg-blue-50 p-4 rounded-lg">
            <ul className="list-disc pl-5 space-y-1">
              {formatPersonalConcerns().map((concern, index) => (
                <li key={index} className="text-gray-800">{concern}</li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Family Concerns */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-[#3A0323]">Family Concerns</h3>
          <div className="bg-green-50 p-4 rounded-lg">
            <ul className="list-disc pl-5 space-y-1">
              {formatFamilyConcerns().map((concern, index) => (
                <li key={index} className="text-gray-800">{concern}</li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Interpersonal Concerns */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-[#3A0323]">Interpersonal Concerns</h3>
          <div className="bg-purple-50 p-4 rounded-lg">
            <ul className="list-disc pl-5 space-y-1">
              {formatInterpersonalConcerns().map((concern, index) => (
                <li key={index} className="text-gray-800">{concern}</li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Grief/Bereavement Concerns */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-[#3A0323]">Grief/Bereavement</h3>
          <div className="bg-red-50 p-4 rounded-lg">
            <ul className="list-disc pl-5 space-y-1">
              {formatGriefConcerns().map((concern, index) => (
                <li key={index} className="text-gray-800">{concern}</li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Getting To Know You section */}
        {student.gettingToKnowYou && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-[#3A0323]">Getting To Know You</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {student.gettingToKnowYou.q1 && (
                <div className="mb-3">
                  <p className="text-sm text-gray-500 font-medium">What brings you to counseling today?</p>
                  <p className="mt-1">{student.gettingToKnowYou.q1}</p>
                </div>
              )}
              {student.gettingToKnowYou.q2 && (
                <div className="mb-3">
                  <p className="text-sm text-gray-500 font-medium">What have you tried so far to deal with the problem?</p>
                  <p className="mt-1">{student.gettingToKnowYou.q2}</p>
                </div>
              )}
              {student.gettingToKnowYou.q3 && (
                <div className="mb-3">
                  <p className="text-sm text-gray-500 font-medium">What are your expectations in counseling?</p>
                  <p className="mt-1">{student.gettingToKnowYou.q3}</p>
                </div>
              )}
              {student.gettingToKnowYou.q4 && (
                <div className="mb-3">
                  <p className="text-sm text-gray-500 font-medium">What are your strengths?</p>
                  <p className="mt-1">{student.gettingToKnowYou.q4}</p>
                </div>
              )}
              {student.gettingToKnowYou.q5 && (
                <div className="mb-3">
                  <p className="text-sm text-gray-500 font-medium">What do you do to cope with stress?</p>
                  <p className="mt-1">{student.gettingToKnowYou.q5}</p>
                </div>
              )}
              {student.gettingToKnowYou.q6 && (
                <div className="mb-3">
                  <p className="text-sm text-gray-500 font-medium">What do you enjoy doing?</p>
                  <p className="mt-1">{student.gettingToKnowYou.q6}</p>
                </div>
              )}
              {student.gettingToKnowYou.q7 && (
                <div className="mb-3">
                  <p className="text-sm text-gray-500 font-medium">Is there anything else you'd like to share?</p>
                  <p className="mt-1">{student.gettingToKnowYou.q7}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Session Notes */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-[#3A0323]">Session Notes</h3>
          <textarea
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
            placeholder="Enter session notes..."
          />
        </div>
        
        {/* Session Status Update */}
        {!isInitialConfirmation && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-[#3A0323]">Update Session Status</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <select
                    className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={dropdownValue}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleRemarkChange(student.id, e.target.value, null, null, true); // true indicates this is just a dropdown change
                      }
                    }}
                    disabled={updatingId === student.id}
                  >
                    <option value="">Select Remarks</option>
                    <option value="Attended">Attended</option>
                    <option value="No Show">No Show</option>
                    <option value="No Response">No Response</option>
                    
                    <option value="Follow up">Follow-up</option>
                  </select>
                </div>
              </div>
              
              {/* Only show follow-up date and time fields when Follow-up is selected */}
              {isSchedulingFollowUp && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                    <input
                      type="date"
                      className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      min={new Date().toISOString().split('T')[0]}
                      value={followUpDate}
                      onChange={(e) => {
                        console.log("Date selected:", e.target.value);
                        setFollowUpDate(e.target.value);
                      }}
                      required={isSchedulingFollowUp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Time</label>
                    <input
                      type="time"
                      className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={followUpTime}
                      onChange={(e) => {
                        console.log("Time selected:", e.target.value);
                        setFollowUpTime(e.target.value);
                      }}
                      required={isSchedulingFollowUp}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 border-t pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-[#3A0323] text-white rounded-md hover:bg-[#4B0A2E] transition-colors"
            disabled={
              updatingId === student.id || 
              (isPostSession && !isSchedulingFollowUp && !dropdownValue) ||
              (isSchedulingFollowUp && (!followUpDate || !followUpTime))
            }
          >
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentDetailsModal;