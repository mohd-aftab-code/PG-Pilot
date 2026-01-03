import React from 'react';

/**
 * Skeleton UI Components
 * 
 * Reusable skeleton loaders with shimmer animation for better UX during data loading.
 * 
 * Usage Examples:
 * 
 * // Basic skeleton
 * <Skeleton className="h-10 w-full" />
 * 
 * // Text skeleton
 * <SkeletonText lines={3} />
 * 
 * // Card skeleton
 * <SkeletonCard showHeader={true} lines={4} showButton={true} />
 * 
 * // Table skeleton
 * <SkeletonTable columns={5} rows={5} showActions={true} />
 * 
 * // Stats card skeleton
 * <SkeletonStatsCard />
 * 
 * // Conditional rendering
 * {loading ? <SkeletonTable columns={columns.length} rows={5} /> : <DataTable data={data} />}
 */

/**
 * Base Skeleton Component with shimmer animation
 * Supports Tailwind CSS shimmer effect
 */
const Skeleton = ({ 
  className = '', 
  variant = 'rectangular', 
  width, 
  height,
  rounded = 'md',
  ...props 
}) => {
  const baseClasses = 'animate-pulse bg-[#0B0F14] skeleton-shimmer';
  
  const variantClasses = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded',
    card: 'rounded-lg',
  };

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  const style = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant] || variantClasses.rectangular}
        ${roundedClasses[rounded] || roundedClasses.md}
        ${className}
      `}
      style={style}
      {...props}
    />
  );
};

/**
 * Skeleton Text Component
 * Mimics text lines with varying widths
 */
export const SkeletonText = ({ 
  lines = 1, 
  className = '',
  lineHeight = 'h-4',
  spacing = 'space-y-2'
}) => {
  const widths = ['w-full', 'w-5/6', 'w-4/6', 'w-3/4', 'w-full'];
  
  return (
    <div className={`${spacing} ${className}`}>
      {Array.from({ length: lines }).map((_, idx) => (
        <Skeleton
          key={idx}
          variant="text"
          className={`${lineHeight} ${widths[idx % widths.length]}`}
        />
      ))}
    </div>
  );
};

/**
 * Skeleton Card Component
 * Mimics card structure with padding and content
 */
export const SkeletonCard = ({ 
  className = '',
  showHeader = true,
  lines = 3,
  showButton = false
}) => {
  return (
    <div className={`bg-[#0F1720] border border-primary/10 rounded-lg p-4 sm:p-6 ${className}`}>
      {showHeader && (
        <div className="mb-4">
          <Skeleton className="h-6 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}
      <SkeletonText lines={lines} />
      {showButton && (
        <div className="mt-4">
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      )}
    </div>
  );
};

/**
 * Skeleton Button Component
 */
export const SkeletonButton = ({ 
  size = 'md',
  className = '',
  fullWidth = false
}) => {
  const sizeClasses = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-32',
  };

  return (
    <Skeleton
      className={`
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        rounded-lg
        ${className}
      `}
    />
  );
};

/**
 * Skeleton Table Component
 * Matches DataTable structure for desktop and mobile views
 */
export const SkeletonTable = ({ 
  columns = 5, 
  rows = 5,
  showActions = false,
  className = ''
}) => {
  const totalColumns = showActions ? columns + 1 : columns;

  return (
    <>
      {/* Desktop Table Skeleton */}
      <div className={`hidden md:block overflow-x-auto ${className}`}>
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#0B0F14] border-b border-primary/10">
                {Array.from({ length: totalColumns }).map((_, idx) => (
                  <th key={idx} className="px-4 py-3">
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={`border-b border-primary/10 ${
                    rowIdx % 2 === 0 ? 'bg-[#0F1720]' : 'bg-[#0B0F14]'
                  }`}
                >
                  {Array.from({ length: totalColumns }).map((_, colIdx) => (
                    <td key={colIdx} className="px-4 py-3">
                      <Skeleton className="h-4 w-24" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Skeleton */}
      <div className={`md:hidden space-y-3 px-2 ${className}`}>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className={`bg-[#0F1720] border border-primary/10 rounded-lg p-4 ${
              rowIdx % 2 === 0 ? '' : 'bg-[#0B0F14]'
            }`}
          >
            <div className="space-y-3">
              {Array.from({ length: columns }).map((_, colIdx) => (
                <div key={colIdx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
              {showActions && (
                <div className="pt-2 border-t border-primary/10 flex flex-wrap gap-2">
                  <Skeleton className="h-9 flex-1 rounded-lg" />
                  <Skeleton className="h-9 flex-1 rounded-lg" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

/**
 * Skeleton Avatar Component
 */
export const SkeletonAvatar = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <Skeleton
      variant="circular"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};

/**
 * Skeleton Stats Card Component
 * Matches dashboard stats card structure
 */
export const SkeletonStatsCard = ({ className = '' }) => {
  return (
    <div className={`bg-[#0F1720] p-4 sm:p-5 md:p-6 rounded-xl border border-primary/10 ${className}`}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <Skeleton className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl" />
        <Skeleton className="h-4 w-12 hidden sm:block" />
      </div>
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-8 w-32 mb-2" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
};

/**
 * Skeleton Activity Item Component
 */
export const SkeletonActivityItem = ({ className = '' }) => {
  return (
    <div className={`flex items-start gap-3 p-3 bg-[#0B0F14] rounded-lg border border-primary/10 ${className}`}>
      <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
};

export default Skeleton;
export { Skeleton };

