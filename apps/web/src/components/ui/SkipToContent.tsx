// =============================================================================
// Skip to Content Link
// Allows keyboard users to skip navigation and go directly to main content.
// =============================================================================

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}
