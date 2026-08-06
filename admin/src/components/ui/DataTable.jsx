import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Inbox } from 'lucide-react';
import Skeleton from './Skeleton.jsx';
import './DataTable.css';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No data found',
  onRowClick,
  pagination,
  skeletonRows = 5,
  rowKey = 'id',
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortable) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }

      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, columns, sortKey, sortDir]);

  const handleSort = (key) => {
    const col = columns.find((c) => c.key === key);
    if (!col?.sortable) return;

    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const getRowKey = (row, index) => {
    if (typeof rowKey === 'function') return rowKey(row, index);
    return row[rowKey] ?? index;
  };

  const renderCell = (col, row) => {
    if (col.render) return col.render(row[col.key], row);
    return row[col.key] ?? '—';
  };

  if (loading) {
    return (
      <div className="data-table">
        <div className="data-table__desktop">
          <table>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      <Skeleton height={16} width={col.key === columns[0]?.key ? '70%' : '50%'} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!sortedData.length) {
    return (
      <div className="data-table data-table--empty">
        <Inbox size={40} strokeWidth={1.5} />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="data-table">
      <div className="data-table__desktop">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.sortable ? 'data-table__th--sortable' : undefined}
                  onClick={() => handleSort(col.key)}
                >
                  <span className="data-table__th-inner">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc'
                        ? <ChevronUp size={14} />
                        : <ChevronDown size={14} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr
                key={getRowKey(row, index)}
                className={onRowClick ? 'data-table__row--clickable' : undefined}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} data-label={col.label}>
                    {renderCell(col, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="data-table__mobile">
        {sortedData.map((row, index) => (
          <div
            key={getRowKey(row, index)}
            className={`data-table__card ${onRowClick ? 'data-table__card--clickable' : ''}`}
            onClick={() => onRowClick?.(row)}
            role={onRowClick ? 'button' : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onKeyDown={(e) => {
              if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onRowClick(row);
              }
            }}
          >
            {columns.map((col) => (
              <div key={col.key} className="data-table__card-row">
                <span className="data-table__card-label">{col.label}</span>
                <span className="data-table__card-value">{renderCell(col, row)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {pagination && (
        <div className="data-table__pagination">
          <span className="data-table__page-info">
            Page {pagination.page} of {pagination.totalPages}
            {pagination.totalItems != null && (
              <> · {pagination.totalItems} items</>
            )}
          </span>
          <div className="data-table__page-controls">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange?.(pagination.page - 1)}
            >
              <ChevronLeft size={16} />
              Prev
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange?.(pagination.page + 1)}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
