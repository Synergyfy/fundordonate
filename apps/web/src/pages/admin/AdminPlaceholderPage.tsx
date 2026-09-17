// =============================================================================
// Admin Placeholder Page
// Displayed for admin routes that are not yet fully implemented.
// =============================================================================

interface AdminPlaceholderPageProps {
  title: string;
  description?: string;
  groupName?: string;
  icon?: React.ReactNode;
}

export function AdminPlaceholderPage({
  title,
  description,
  groupName,
  icon,
}: AdminPlaceholderPageProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
          {icon || (
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          )}
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>
        {description && (
          <p className="text-sm text-gray-500 mb-4">{description}</p>
        )}
        {groupName && (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {groupName}
          </span>
        )}
      </div>
    </div>
  );
}
