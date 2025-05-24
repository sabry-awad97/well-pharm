import { Button } from '@/components/ui/button';
import { LayoutGrid, LayoutList } from 'lucide-react';

interface ViewToggleProps {
  view: 'table' | 'grid';
  onViewChange: (view: 'table' | 'grid') => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center space-x-2 rounded-md border p-1">
      <Button
        variant={view === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('table')}
        className="px-2.5"
      >
        <LayoutList className="mr-1 h-4 w-4" />
        Table
      </Button>
      <Button
        variant={view === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('grid')}
        className="px-2.5"
      >
        <LayoutGrid className="mr-1 h-4 w-4" />
        Grid
      </Button>
    </div>
  );
}
