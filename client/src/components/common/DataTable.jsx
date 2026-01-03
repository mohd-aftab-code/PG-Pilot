import React from 'react';

const DataTable = ({ columns, data, onEdit, onDelete, onView, loading = false }) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#22D3EE] mb-3"></div>
        <p className="text-[#9CA3AF]">Loading...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-[#9CA3AF]">No records found</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto -mx-4 md:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#0B0F14] border-b border-primary/10">
                {columns.map((col, idx) => (
                  <th key={idx} className="px-3 md:px-4 py-2 md:py-3 text-left text-[#E5E7EB] font-semibold text-xs md:text-sm whitespace-nowrap">
                    {col.header}
                  </th>
                ))}
                {(onEdit || onDelete || onView) && (
                  <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[#E5E7EB] font-semibold text-xs md:text-sm whitespace-nowrap">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIdx) => (
                <tr 
                  key={rowIdx} 
                  className={`border-b border-primary/10 transition-colors ${
                    rowIdx % 2 === 0 ? 'bg-[#0F1720]' : 'bg-[#0B0F14]'
                  } hover:bg-[#1FB6C1]/10`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-3 md:px-4 py-2 md:py-3 text-[#E5E7EB] text-xs md:text-sm">
                      {col.render ? col.render(row[col.accessor], row) : row[col.accessor] || '-'}
                    </td>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <td className="px-3 md:px-4 py-2 md:py-3">
                      <div className="flex flex-wrap gap-1.5 md:gap-2">
                        {onView && (
                          <button
                            onClick={() => onView(row)}
                            className="px-2 md:px-3 py-1 md:py-1.5 bg-[#22D3EE]/20 text-[#22D3EE] rounded-lg hover:bg-[#22D3EE]/30 transition-all text-xs font-medium border border-[#22D3EE]/30"
                          >
                            View
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="px-2 md:px-3 py-1 md:py-1.5 bg-[#1FB6C1]/20 text-[#1FB6C1] rounded-lg hover:bg-[#1FB6C1]/30 transition-all text-xs font-medium border border-[#1FB6C1]/30"
                          >
                            Edit
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="px-2 md:px-3 py-1 md:py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-xs font-medium border border-red-500/30"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3 px-2">
        {data.map((row, rowIdx) => (
          <div 
            key={rowIdx}
            className={`bg-[#0F1720] border border-primary/10 rounded-lg p-4 ${
              rowIdx % 2 === 0 ? '' : 'bg-[#0B0F14]'
            }`}
          >
            <div className="space-y-3">
              {columns.map((col, colIdx) => (
                <div key={colIdx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-[#9CA3AF] text-xs font-medium">{col.header}:</span>
                  <span className="text-[#E5E7EB] text-sm">
                    {col.render ? col.render(row[col.accessor], row) : row[col.accessor] || '-'}
                  </span>
                </div>
              ))}
              {(onEdit || onDelete || onView) && (
                <div className="pt-2 border-t border-primary/10 flex flex-wrap gap-2">
                  {onView && (
                    <button
                      onClick={() => onView(row)}
                      className="flex-1 px-3 py-2 bg-[#22D3EE]/20 text-[#22D3EE] rounded-lg hover:bg-[#22D3EE]/30 transition-all text-xs font-medium border border-[#22D3EE]/30"
                    >
                      View
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(row)}
                      className="flex-1 px-3 py-2 bg-[#1FB6C1]/20 text-[#1FB6C1] rounded-lg hover:bg-[#1FB6C1]/30 transition-all text-xs font-medium border border-[#1FB6C1]/30"
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(row)}
                      className="flex-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-xs font-medium border border-red-500/30"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default DataTable;

