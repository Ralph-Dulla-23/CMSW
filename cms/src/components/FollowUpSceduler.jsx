import React, { useState } from 'react';
import { toast } from 'react-toastify';

function FollowUpScheduler({ onSchedule, onCancel }) {
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');
  
  const handleSchedule = () => {
    if (!followUpDate) {
      toast.error('Please select a follow-up date');
      return;
    }
    
    if (!followUpTime) {
      toast.error('Please select a follow-up time');
      return;
    }
    
    onSchedule(followUpDate, followUpTime);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-96 rounded-lg shadow-lg p-6 relative">
        <h2 className="text-xl font-bold mb-4">Schedule Follow-up</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
          <input
            type="date"
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            min={new Date().toISOString().split('T')[0]}
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Time</label>
          <input
            type="time"
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={followUpTime}
            onChange={(e) => setFollowUpTime(e.target.value)}
            required
          />
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={handleSchedule}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            disabled={!followUpDate || !followUpTime}
          >
            Schedule Follow-up
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default FollowUpScheduler;