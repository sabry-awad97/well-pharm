import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Table as UITable,
} from '@/components/ui/table';
import { type Table, flexRender } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useRef } from 'react';

interface VirtualizedTableProps<T> {
  table: Table<T>;
}

export function VirtualizedTable<T>({ table }: VirtualizedTableProps<T>) {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Set up virtualizer for rows
  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 45, // Approximate row height
    overscan: 10,
  });

  // Recalculate when data changes
  useEffect(() => {
    rowVirtualizer.measure();
  }, [rows.length, rowVirtualizer]);

  return (
    <div
      ref={tableContainerRef}
      className="rounded-md border"
      style={{
        height: Math.min(500, Math.max(150, rows.length * 45 + 40)), // Dynamic height with min/max
        overflow: 'auto',
      }}
    >
      <UITable>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead
                  key={header.id}
                  style={{ width: header.getSize() }}
                  className={
                    header.id === 'genericName'
                      ? 'hidden md:table-cell'
                      : header.id === 'dosageForm' || header.id === 'strength'
                        ? 'hidden lg:table-cell'
                        : undefined
                  }
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const row = rows[virtualRow.index];
            return (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : undefined}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
                }}
                className="absolute w-full"
              >
                {row.getVisibleCells().map(cell => (
                  <TableCell
                    key={cell.id}
                    className={
                      cell.column.id === 'genericName'
                        ? 'hidden md:table-cell'
                        : cell.column.id === 'dosageForm' ||
                            cell.column.id === 'strength'
                          ? 'hidden lg:table-cell'
                          : cell.column.id === 'actions'
                            ? 'text-right'
                            : undefined
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </UITable>
    </div>
  );
}
