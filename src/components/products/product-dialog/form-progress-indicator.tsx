interface FormProgressIndicatorProps {
  activeTab: string;
}

export function FormProgressIndicator({
  activeTab,
}: FormProgressIndicatorProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between">
        <span className="text-sm font-medium">Basic Info</span>
        <span className="text-sm font-medium">Product Details</span>
        <span className="text-sm font-medium">Additional Info</span>
      </div>
      <div className="relative mt-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-between">
          <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium">
            1
          </div>
          <div
            className={`${
              activeTab === 'details' || activeTab === 'additional'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            } flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium`}
          >
            2
          </div>
          <div
            className={`${
              activeTab === 'additional'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            } flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium`}
          >
            3
          </div>
        </div>
      </div>
    </div>
  );
}
