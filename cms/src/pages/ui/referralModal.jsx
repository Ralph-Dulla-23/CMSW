import React, { useState } from 'react';
import { updateFormStatus } from '../../firebase/firestoreService';
import { toast } from 'react-toastify';
import { format } from 'date-fns'; // 

const ReferralModal = ({ referral, onClose, handleRemarkChange, updatingId, dropdownValue, isValidDate }) => {
  const [sessionNotes, setSessionNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');

  // Determine the state of the referral
  const isInitialConfirmation = referral.status === 'Pending' || !referral.status;
  const isPostSession = referral.status === 'Confirmed' || referral.status === 'Rescheduled';
  const isSchedulingFollowUp = dropdownValue === 'Follow up';

  // Check if referral data exists
  if (!referral) {
    console.error("No referral data provided to modal");
    return null;
  }

  console.log("Rendering referral modal with data:", referral);

  // Extract referral data - handles both direct referrals and processed ones
  const clientName = referral.clientName || referral.name || 'Unknown';
  const courseYear = referral.courseYear || `${referral.college || ''} ${referral.year || ''}`;
  const date = referral.date ? (
    isValidDate(new Date(referral.date)) ? 
      format(new Date(referral.date), 'MMMM d, yyyy') : 
      referral.date
  ) : 'Unknown';
  const time = referral.time || referral.details?.time || 'Unknown';
  const referredBy = referral.referredBy || referral.referral || 'Unknown';
  const remarks = referral.remarks || 'None specified';
  const otherConcerns = referral.otherConcerns || 'None specified';
  
  // Get academic concerns
  let academicConcerns = [];
  if (Array.isArray(referral.academicConcerns) && referral.academicConcerns.length > 0) {
    academicConcerns = referral.academicConcerns;
  } else if (Array.isArray(referral.details?.academics) && referral.details.academics.length > 0) {
    academicConcerns = referral.details.academics;
  }
  
  // Get personal concerns
  let personalConcerns = [];
  if (Array.isArray(referral.personalConcerns) && referral.personalConcerns.length > 0) {
    personalConcerns = referral.personalConcerns;
  } else if (Array.isArray(referral.details?.personal) && referral.details.personal.length > 0) {
    personalConcerns = referral.details.personal;
  }

  // Helper function for status color
  const getStatusClass = (status) => {
    switch(status) {
      case 'Attended': return 'bg-green-100 text-green-800';
      case 'No Show': return 'bg-yellow-100 text-yellow-800';
      case 'No Response': return 'bg-orange-100 text-orange-800';
      case 'Terminated': return 'bg-red-100 text-red-800';
      case 'Follow up': return 'bg-purple-100 text-purple-800';
      case 'Confirmed': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-gray-100 text-gray-800';
      case 'Rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800'; // Default
    }
  };

  // Handle the Accept/Confirm button click
  const handleAccept = () => {
    console.log("ReferralModal handleAccept called");
    console.log("isInitialConfirmation:", isInitialConfirmation);
    console.log("referral.id:", referral.id);
    console.log("dropdownValue:", dropdownValue);
    console.log("sessionNotes:", sessionNotes);
    
    // For initial confirmation (when status is Pending)
    if (isInitialConfirmation) {
      console.log("Confirming referral appointment");
      handleRemarkChange(referral.id, 'Confirmed', null, sessionNotes, false);
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
      
      handleRemarkChange(referral.id, dropdownValue, followUpDate, sessionNotes, false, followUpTime);
    } else if (dropdownValue) {
      handleRemarkChange(referral.id, dropdownValue, null, sessionNotes, false);
    } else {
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
          <h2 className="text-xl font-bold text-[#3A0323]">Referral Information</h2>
          
          {referral.status && (
            <span className={`ml-2 px-2 py-1 rounded-full inline-block text-sm ${getStatusClass(referral.status)}`}>
              {referral.status}
            </span>
          )}
        </div>
        
        {/* Client Information */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-[#3A0323]">Client Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Client Name</p>
              <p className="font-medium">{clientName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Course/Year</p>
              <p className="font-medium">{courseYear}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Appointment Date</p>
              <p className="font-medium">{date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Appointment Time</p>
              <p className="font-medium">{time}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Referred By</p>
              <p className="font-medium">{referredBy}</p>
            </div>
          </div>
        </div>
        
        {/* Academic Concerns */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-[#3A0323]">Academic Concerns</h3>
          {academicConcerns.length > 0 ? (
            <div className="bg-amber-50 p-4 rounded-lg">
              <ul className="list-disc pl-5 space-y-1">
                {academicConcerns.map((concern, index) => (
                  <li key={index} className="text-gray-800">{concern}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500 italic">No academic concerns specified</p>
          )}
        </div>
        
        {/* Personal Concerns */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-[#3A0323]">Personal/Social Concerns</h3>
          {personalConcerns.length > 0 ? (
            <div className="bg-blue-50 p-4 rounded-lg">
              <ul className="list-disc pl-5 space-y-1">
                {personalConcerns.map((concern, index) => (
                  <li key={index} className="text-gray-800">{concern}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500 italic">No personal concerns specified</p>
          )}
        </div>
        
        {/* Other Information */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-[#3A0323]">Additional Information</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="mb-4">
              <p className="text-sm text-gray-500 font-medium">Other Concerns</p>
              <p className="mt-1">{otherConcerns}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Remarks/Observations</p>
              <p className="mt-1">{remarks}</p>
            </div>
          </div>
        </div>
        
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
        
        {/* Session Status Update - Only show if not initial confirmation */}
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
                        handleRemarkChange(referral.id, e.target.value, null, null, true);
                      }
                    }}
                    disabled={updatingId === referral.id}
                  >
                    <option value="">Select Remarks</option>
                    <option value="Attended">Attended</option>
                    <option value="No Show">No Show</option>
                    <option value="No Response">No Response</option>
                    <option value="Terminated">Terminated</option>
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
            type="button"
            onClick={handleAccept}
            className="px-4 py-2 bg-[#3A0323] text-white rounded-md hover:bg-[#4B0A2E] transition-colors"
            disabled={
              updatingId === referral.id || 
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
};

export default ReferralModal;