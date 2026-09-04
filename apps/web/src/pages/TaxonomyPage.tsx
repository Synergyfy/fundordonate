import { CategoryManager } from "@/components/admin/CategoryManager";
import { TagManager } from "@/components/admin/TagManager";

export function TaxonomyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container-page py-6">
          <h1 className="text-2xl font-bold text-gray-900">Categories & Tags</h1>
          <p className="mt-1 text-sm text-gray-500">Manage campaign categories and tags</p>
        </div>
      </div>

      <div className="container-page py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <CategoryManager />
          <TagManager />
        </div>
      </div>
    </div>
  );
}
