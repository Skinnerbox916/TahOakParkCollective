import { TagManager } from "@/components/admin/TagManager";

export default function AdminTagsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tag Management</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create and manage tags for entities. Tags help categorize businesses by identity, friendliness, and amenities.
        </p>
      </div>
      <TagManager />
    </div>
  );
}

