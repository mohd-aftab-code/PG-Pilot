import React from 'react';

const Dashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dashboard cards will go here */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Welcome</h2>
          <p className="text-gray-600">PG Pilot Project Dashboard</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

