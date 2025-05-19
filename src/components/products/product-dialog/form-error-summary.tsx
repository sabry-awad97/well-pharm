import type { FieldErrors } from 'react-hook-form';

interface FormErrorSummaryProps {
  errors: FieldErrors;
  mode: 'create' | 'edit' | 'view';
}

export function FormErrorSummary({ errors, mode }: FormErrorSummaryProps) {
  if (mode === 'view' || Object.keys(errors).length === 0) {
    return null;
  }

  return (
    <div
      className="bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm"
      role="alert"
      aria-live="assertive"
    >
      <p className="font-medium">Please correct the following errors:</p>
      <ul className="mt-2 ml-4 list-disc">
        {Object.entries(errors).map(([field, error]) => (
          <li key={field}>
            {field.charAt(0).toUpperCase() + field.slice(1)}:{' '}
            {error?.message?.toString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
