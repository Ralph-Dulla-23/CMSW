import React from 'react';

const ReferralModal = ({ referral, onClose }) => {
  // Check if referral data exists
  if (!referral) {
    console.log("No referral data provided to modal");
    return null;
  }

  console.log("Rendering referral modal with data:", referral);

  // Extract referral data - handles both direct referrals and processed ones
  const clientName = referral.clientName || referral.name || 'Unknown';
  const courseYear = referral.courseYear || `${referral.college || ''} ${referral.year || ''}`;
  const date = referral.date || referral.details?.date || 'Unknown';
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
        
        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 border-t pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              // You can add functionality to accept the referral here
              alert('Referral accepted!');
              onClose();
            }}
            className="px-4 py-2 bg-[#3A0323] text-white rounded-md hover:bg-[#4B0A2E] transition-colors"
          >
            Accept Referral
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralModal;