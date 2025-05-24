import type { Product } from '@/api/product';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Table } from '@tanstack/react-table';
import { Download, Save, Settings } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface PresetFilter {
  id: string;
  value: unknown;
}

interface TablePreset {
  name: string;
  columnVisibility: Record<string, boolean>;
  sorting: { id: string; desc: boolean }[];
  filters: PresetFilter[];
  timestamp: string;
}

interface TableCustomizationProps {
  table: Table<Product>;
}

export function TableCustomization({ table }: TableCustomizationProps) {
  const [presetName, setPresetName] = useState('');

  // Save current table state as a preset
  const savePreset = () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    const preset = {
      name: presetName,
      columnVisibility: table.getState().columnVisibility,
      sorting: table.getState().sorting,
      filters: table.getState().columnFilters,
      timestamp: new Date().toISOString(),
    };

    // Get existing presets
    const existingPresets = JSON.parse(
      localStorage.getItem('productTablePresets') || '[]',
    );

    // Add new preset
    const updatedPresets = [...existingPresets, preset];

    // Save to localStorage
    localStorage.setItem('productTablePresets', JSON.stringify(updatedPresets));

    toast.success(`Preset "${presetName}" saved successfully`);
    setPresetName('');
  };

  // Load a preset
  const loadPreset = (preset: TablePreset) => {
    table.setColumnVisibility(preset.columnVisibility);
    table.setSorting(preset.sorting);
    for (const filter of preset.filters as PresetFilter[]) {
      table.getColumn(filter.id)?.setFilterValue(filter.value);
    }

    toast.success(`Preset "${preset.name}" loaded`);
  };

  // Export selected rows as CSV
  const exportSelectedRows = () => {
    const selectedRows = table.getSelectedRowModel().rows;

    if (selectedRows.length === 0) {
      toast.error('No rows selected for export');
      return;
    }

    // Create CSV content
    const headers = table
      .getAllColumns()
      .filter(column => column.getIsVisible())
      .map(column => column.id)
      .join(',');

    const rows = selectedRows
      .map(row =>
        table
          .getAllColumns()
          .filter(column => column.getIsVisible())
          .map(column => {
            const value = row.getValue(column.id);
            return typeof value === 'string' && value.includes(',')
              ? `"${value}"`
              : value;
          })
          .join(','),
      )
      .join('\n');

    const csv = `${headers}\n${rows}`;

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `products_export_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${selectedRows.length} rows`);
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="ml-auto">
            <Settings className="mr-2 h-4 w-4" />
            <span>Columns</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {table
            .getAllColumns()
            .filter(column => column.getCanHide())
            .map(column => {
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={value => column.toggleVisibility(!!value)}
                >
                  {column.id.replace(/([A-Z])/g, ' $1').trim()}
                </DropdownMenuCheckboxItem>
              );
            })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        onClick={exportSelectedRows}
        disabled={table.getSelectedRowModel().rows.length === 0}
      >
        <Download className="mr-2 h-4 w-4" />
        Export Selected
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Save className="mr-2 h-4 w-4" />
            <span>Presets</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Save current view</DropdownMenuLabel>
          <div className="px-2 py-1.5">
            <input
              type="text"
              placeholder="Preset name"
              className="w-full rounded-md border px-2 py-1 text-sm"
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
            />
            <Button size="sm" className="mt-2 w-full" onClick={savePreset}>
              Save Current View
            </Button>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Saved presets</DropdownMenuLabel>
          {JSON.parse(localStorage.getItem('productTablePresets') || '[]').map(
            (preset: TablePreset) => (
              <DropdownMenuCheckboxItem
                key={`${preset.name}-${preset.timestamp}`}
                onSelect={() => loadPreset(preset)}
              >
                {preset.name}
                <span className="text-muted-foreground ml-auto text-xs">
                  {new Date(preset.timestamp).toLocaleDateString()}
                </span>
              </DropdownMenuCheckboxItem>
            ),
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
