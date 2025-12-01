import React from 'react';

const NoRecordFound = ({ message = "No records found" }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-6xl mb-4">📭</div>
      <p className="text-gray-500 text-lg">{message}</p>
    </div>
  );
};

export default NoRecordFound;

