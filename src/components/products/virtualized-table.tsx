import { ScrollArea } from '@/components/ui/scroll-area';
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
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    rowVirtualizer.measure();
    // Reset scroll position when page changes to avoid empty view
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [rows.length, rowVirtualizer, table.getState().pagination.pageIndex]);

  return (
    <ScrollArea
      className="rounded-md border"
      style={{ height: 'calc(100vh - 320px)' }}
    >
      <div ref={tableContainerRef} className="w-full">
        <table className="w-full caption-bottom text-sm">
          <thead className="bg-background sticky top-0 z-10 [&_tr]:border-b">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b transition-colors">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className={`text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap ${
                      header.id === 'genericName'
                        ? 'hidden md:table-cell'
                        : header.id === 'dosageForm' || header.id === 'strength'
                          ? 'hidden lg:table-cell'
                          : ''
                    }`}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {rows.length === 0 ? (
              <tr className="border-b transition-colors">
                <td
                  colSpan={table.getAllColumns().length}
                  className="h-24 p-2 text-center align-middle"
                >
                  No results found.
                </td>
              </tr>
            ) : (
              <tr style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                <td
                  colSpan={table.getAllColumns().length}
                  style={{ padding: 0, border: 'none', position: 'relative' }}
                >
                  {rowVirtualizer.getVirtualItems().map(virtualRow => {
                    const row = rows[virtualRow.index];
                    return (
                      <div
                        key={row.id}
                        data-state={
                          row.getIsSelected() ? 'selected' : undefined
                        }
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                          display: 'flex',
                          alignItems: 'center',
                          borderBottom: '1px solid var(--border)',
                          background: row.getIsSelected()
                            ? 'var(--muted)'
                            : undefined,
                        }}
                        className="hover:bg-muted/50"
                      >
                        {row.getVisibleCells().map(cell => (
                          <div
                            key={cell.id}
                            style={{
                              padding: '8px',
                              flexGrow: cell.column.getSize() ? 0 : 1,
                              flexBasis: cell.column.getSize()
                                ? `${cell.column.getSize()}px`
                                : 0,
                              width: cell.column.getSize()
                                ? `${cell.column.getSize()}px`
                                : 'auto',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            className={
                              cell.column.id === 'genericName'
                                ? 'hidden md:flex'
                                : cell.column.id === 'dosageForm' ||
                                    cell.column.id === 'strength'
                                  ? 'hidden lg:flex'
                                  : cell.column.id === 'actions'
                                    ? 'justify-end'
                                    : undefined
                            }
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ScrollArea>
  );
}
