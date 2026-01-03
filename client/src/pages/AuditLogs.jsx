import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import DataTable from '../components/common/DataTable';
import { formatDateDDMMYY } from '../components/common/dateUtils';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/audit-logs');
      setLogs(response.data.audit_logs || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'User', accessor: 'user_name', render: (val) => val || '-' },
    { header: 'PG', accessor: 'pg_name', render: (val) => val || '-' },
    { header: 'Action', accessor: 'action' },
    { header: 'Date', accessor: 'created_at', render: (val) => formatDateDDMMYY(val) },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-[#E5E7EB] mb-6">Audit Logs</h1>
      <DataTable columns={columns} data={logs} loading={loading} />
    </div>
  );
};

export default AuditLogs;

