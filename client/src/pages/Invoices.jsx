import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getStoredPgId } from '../utils/auth';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import { formatDateDDMMYY } from '../components/common/dateUtils';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const pgId = getStoredPgId();

  useEffect(() => {
    if (pgId) fetchInvoices();
  }, [pgId]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/invoices/pg/${pgId}`);
      setInvoices(response.data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };


  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30', label: 'Paid' },
      unpaid: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30', label: 'Unpaid' },
    };
    const config = statusConfig[status] || statusConfig.unpaid;
    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
        {config.label}
      </span>
    );
  };

  const columns = [
    { header: 'Invoice ID', accessor: 'id', render: (val) => `#INV-${String(val).padStart(6, '0')}` },
    { header: 'Amount', accessor: 'amount', render: (val) => `₹${parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { header: 'Invoice Date', accessor: 'invoice_date', render: (val) => formatDateDDMMYY(val) },
    { header: 'Due Date', accessor: 'due_date', render: (val) => formatDateDDMMYY(val) },
    { header: 'Status', accessor: 'status', render: (val) => getStatusBadge(val) },
    { 
      header: 'Payment Info', 
      accessor: 'razorpay_payment_id', 
      render: (val, row) => {
        if (row.status === 'paid' && val) {
          return (
            <div className="flex flex-col gap-1 text-xs">
              <span className="text-[#22D3EE]">Payment ID: {val.substring(0, 12)}...</span>
              {row.razorpay_order_id && (
                <span className="text-[#9CA3AF]">Order: {row.razorpay_order_id.substring(0, 12)}...</span>
              )}
            </div>
          );
        }
        return <span className="text-[#9CA3AF] text-xs">-</span>;
      }
    },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#E5E7EB]">Invoices</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">View auto-generated invoices from payments</p>
        </div>
      </div>
      {/* Table */}
      <div className="bg-[#0F1720] border border-primary/10 rounded-lg overflow-hidden">
        <DataTable 
          columns={columns} 
          data={invoices} 
          loading={loading} 
          onView={(inv) => {
            setViewingInvoice(inv);
            setIsModalOpen(true);
          }}
        />
      </div>
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { 
          setIsModalOpen(false); 
          setViewingInvoice(null); 
        }} 
        title="Invoice Details"
        size="lg"
        position="right"
      >
        {viewingInvoice && (
          <div className="space-y-4">
            <div className="bg-[#0F1720] border border-primary/10 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-primary/10">
                <h3 className="text-lg font-semibold text-[#E5E7EB]">Invoice #{String(viewingInvoice.id).padStart(6, '0')}</h3>
                {getStatusBadge(viewingInvoice.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#9CA3AF] mb-1">Amount</p>
                  <p className="text-lg font-semibold text-[#E5E7EB]">₹{parseFloat(viewingInvoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-xs text-[#9CA3AF] mb-1">Invoice Date</p>
                  <p className="text-sm text-[#E5E7EB]">{formatDateDDMMYY(viewingInvoice.invoice_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#9CA3AF] mb-1">Due Date</p>
                  <p className="text-sm text-[#E5E7EB]">{formatDateDDMMYY(viewingInvoice.due_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#9CA3AF] mb-1">Created At</p>
                  <p className="text-sm text-[#E5E7EB]">{formatDateDDMMYY(viewingInvoice.created_at)}</p>
                </div>
              </div>

              {viewingInvoice.status === 'paid' && (viewingInvoice.razorpay_payment_id || viewingInvoice.razorpay_order_id || viewingInvoice.transaction_id) && (
                <div className="pt-3 border-t border-primary/10">
                  <h4 className="text-sm font-semibold text-[#22D3EE] mb-3">Payment Information</h4>
                  <div className="space-y-2">
                    {viewingInvoice.razorpay_order_id && (
                      <div className="flex justify-between">
                        <span className="text-xs text-[#9CA3AF]">Razorpay Order ID:</span>
                        <span className="text-xs text-[#E5E7EB] font-mono">{viewingInvoice.razorpay_order_id}</span>
                      </div>
                    )}
                    {viewingInvoice.razorpay_payment_id && (
                      <div className="flex justify-between">
                        <span className="text-xs text-[#9CA3AF]">Razorpay Payment ID:</span>
                        <span className="text-xs text-[#E5E7EB] font-mono">{viewingInvoice.razorpay_payment_id}</span>
                      </div>
                    )}
                    {viewingInvoice.transaction_id && (
                      <div className="flex justify-between">
                        <span className="text-xs text-[#9CA3AF]">Transaction ID:</span>
                        <span className="text-xs text-[#E5E7EB] font-mono">{viewingInvoice.transaction_id}</span>
                      </div>
                    )}
                    {viewingInvoice.order_id && (
                      <div className="flex justify-between">
                        <span className="text-xs text-[#9CA3AF]">Order ID:</span>
                        <span className="text-xs text-[#E5E7EB] font-mono">{viewingInvoice.order_id}</span>
                      </div>
                    )}
                    {viewingInvoice.payment_id && (
                      <div className="flex justify-between">
                        <span className="text-xs text-[#9CA3AF]">Payment ID:</span>
                        <span className="text-xs text-[#E5E7EB] font-mono">{viewingInvoice.payment_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => {
                setIsModalOpen(false);
                setViewingInvoice(null);
              }}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Invoices;


