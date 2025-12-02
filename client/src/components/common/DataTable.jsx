import React from 'react';

const DataTable = ({ columns, data, onEdit, onDelete, onView, loading = false }) => {
  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No records found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-border rounded bg-card">
      <table className="w-full">
        <thead>
          <tr className="bg-secondary/50 border-b border-border">
            {columns.map((col, idx) => (
              <th key={idx} className="px-4 py-3 text-left text-foreground font-semibold text-sm">
                {col.header}
              </th>
            ))}
            {(onEdit || onDelete || onView) && (
              <th className="px-4 py-3 text-left text-foreground font-semibold text-sm">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} className="border-b border-border hover:bg-secondary/30 transition-colors">
              {columns.map((col, colIdx) => (
                <td key={colIdx} className="px-4 py-3 text-foreground text-sm">
                  {col.render ? col.render(row[col.accessor], row) : row[col.accessor] || '-'}
                </td>
              ))}
              {(onEdit || onDelete || onView) && (
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {onView && (
                      <button
                        onClick={() => onView(row)}
                        className="px-3 py-1.5 bg-primary text-primary-foreground rounded hover:bg-accent transition-all text-xs font-medium shadow-sm"
                      >
                        View
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="px-3 py-1.5 bg-accent text-accent-foreground rounded hover:bg-primary transition-all text-xs font-medium shadow-sm"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row)}
                        className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded hover:opacity-90 transition-all text-xs font-medium shadow-sm"
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
  );
};

export default DataTable;

