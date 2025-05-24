import { InventoryTrends } from '@/components/inventory/InventoryTrends';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/inventory/trends')({
  component: InventoryTrendsPage,
});

function InventoryTrendsPage() {
  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader
        title="Inventory Trends"
        description="Analyze inventory performance and track key metrics over time"
      />

      <Card>
        <CardHeader>
          <CardTitle>Inventory Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <InventoryTrends />
        </CardContent>
      </Card>
    </div>
  );
}
