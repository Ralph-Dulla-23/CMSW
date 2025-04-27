import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from 'primereact/button';   


export default function AdminNavbar() {
  const navigate = useNavigate();

  const handleAdmindashboardClick = () => {
    navigate('/Admindashboard');
  }

  return (
    <div className="w-full bg-white pt-10 px-16 flex justify-between items-center" style={{ height: '72px' }}>
      <img src="/src/assets/img/cmslogo.png" alt="Logo" className="w-16 h-16" />
      <nav className="flex items-center gap-6">
        <div className="flex gap-6">
          <a onClick={() => navigate("/Admindashboard")} className="text-gray-700 font-medium hover:text-[#3A0323] transition-colors cursor-pointer">Dashboard</a>
          <a onClick={() => navigate("/Reports")} className="text-gray-700 font-medium hover:text-[#3A0323] transition-colors cursor-pointer">Reports</a>
          <a onClick={() => navigate("/SubmittedFormsManagement")} className="text-gray-700 font-medium hover:text-[#3A0323] transition-colors cursor-pointer">Submission</a>
          <a onClick={() => navigate("/Schedule")} className="text-gray-700 font-medium hover:text-[#3A0323] transition-colors cursor-pointer">Schedule</a>
          <a onClick={() => navigate("/History")} className="text-gray-700 font-medium hover:text-[#3A0323] transition-colors cursor-pointer">History</a>
        </div>
        
        <button onClick={() => navigate("/")} className="bg-[#3A0323] hover:bg-[#2a021a] text-white px-6 py-3 rounded-md transition-colors">
          Logout
        </button>
      </nav>
    </div>
  );
}
