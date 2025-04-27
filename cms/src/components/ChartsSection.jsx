import React from 'react';
import { Chart } from 'primereact/chart';

const ChartsSection = ({
  studentsPerCollegeData,
  sessionTypesData,
  counselingSessionsData,
  yearPerCollegesData,
  remarksDistributionData,
  chartOptions
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {/* Counseling Sessions Over Time (Line Chart) */}
      <ChartCard 
        title="Counseling Sessions Over Time"
        type="line"
        data={counselingSessionsData}
        options={chartOptions}
      />

      {/* Students per College (Pie Chart) */}
      <ChartCard 
        title="Students per College"
        type="pie"
        data={studentsPerCollegeData}
        options={chartOptions}
      />

      {/* Session Types (Bar Chart) */}
      <ChartCard 
        title="Session Types"
        type="bar"
        data={sessionTypesData}
        options={chartOptions}
      />

      {/* Year per Colleges (Bar Chart) */}
      <ChartCard 
        title="Year Distribution"
        type="bar"
        data={yearPerCollegesData}
        options={chartOptions}
      />

      {/* Remarks Distribution (Pie Chart) */}
      <ChartCard 
        title="Remarks Distribution"
        type="pie"
        data={remarksDistributionData}
        options={chartOptions}
        className="md:col-span-2 lg:col-span-2"
      />
    </div>
  );
};

// Helper component for individual charts with customized tooltips
const ChartCard = ({ title, type, data, options, className = '' }) => {
  // Create custom options based on chart type
  const getCustomOptions = () => {
    // Start with the base options
    const customOptions = { 
      ...options,
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        ...(options?.plugins || {}),
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            font: {
              size: 10
            }
          }
        }
      }
    };
    
    // For pie charts, customize the tooltip to show percentages
    if (type === 'pie' || type === 'doughnut') {
      customOptions.plugins = {
        ...customOptions.plugins,
        tooltip: {
          callbacks: {
            label: function(context) {
              // Make sure we have valid data
              if (!context || context.raw === undefined) return 'No data';
              
              const label = context.label || 'Unknown';
              const value = context.raw || 0;
              
              // Calculate percentage
              let percentage = 0;
              if (context.dataset && Array.isArray(context.dataset.data)) {
                const total = context.dataset.data.reduce((sum, val) => sum + (val || 0), 0);
                if (total > 0) {
                  percentage = Math.round((value / total) * 100);
                }
              }
              
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      };
    }
    
    // For bar and line charts, show the value directly
    if (type === 'bar' || type === 'line') {
      customOptions.plugins = {
        ...customOptions.plugins,
        tooltip: {
          callbacks: {
            label: function(context) {
              if (!context) return 'No data';
              
              const label = context.dataset.label || '';
              const value = context.raw || 0;
              
              return `${label}: ${value}`;
            }
          }
        }
      };
      
      // Add custom scales for bar charts
      if (type === 'bar') {
        customOptions.scales = {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0 // Show only whole numbers
            }
          }
        };
      }
    }
    
    return customOptions;
  };

  // Check if data is valid and has content
  const hasValidData = () => {
    if (!data || !data.labels || !data.datasets) return false;
    
    // Check if there are any non-zero values
    if (data.datasets.length === 0) return false;
    
    const hasNonZeroValues = data.datasets.some(dataset => 
      dataset.data && dataset.data.some(value => value > 0)
    );
    
    return data.labels.length > 0 && hasNonZeroValues;
  };

  return (
    <div className={`bg-white border p-4 rounded-lg shadow-md mx-2 ${className}`}>
      <h2 className="text-lg font-semibold mb-2 text-[#3A0323]">{title}</h2>
      {hasValidData() ? (
        <div className="h-[250px]">
          <Chart 
            type={type} 
            data={data} 
            options={getCustomOptions()} 
            style={{ width: '100%', height: '100%' }} 
          />
        </div>
      ) : (
        <div className="flex justify-center items-center h-[250px] text-gray-500 bg-gray-50 rounded">
          <div className="text-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-10 w-10 mx-auto text-gray-400 mb-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
              />
            </svg>
            <p>No data available for this timeframe</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartsSection;