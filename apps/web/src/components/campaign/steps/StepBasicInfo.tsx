import { useState } from "react";
import type { CampaignFormData } from "../CampaignBuilder";
import { FileUpload } from "@/components/ui/FileUpload";

interface Props {
  formData: CampaignFormData;
  onUpdate: (updates: Partial<CampaignFormData>) => void;
}

export function StepBasicInfo({ formData, onUpdate }: Props) {
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      onUpdate({ tags: [...formData.tags, tag] });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    onUpdate({ tags: formData.tags.filter((t) => t !== tag) });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
        <p className="mt-1 text-sm text-gray-500">
          Tell people about your campaign. A great title and description help attract supporters.
        </p>
      </div>

      {/* Campaign Mode */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Campaign Type</label>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onUpdate({ mode: "donation" })}
            className={`rounded-lg border-2 p-4 text-left transition-colors ${
              formData.mode === "donation"
                ? "border-primary-600 bg-primary-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="block font-semibold text-gray-900">Donation</span>
            <span className="text-sm text-gray-500">Receive direct donations</span>
          </button>
          <button
            type="button"
            onClick={() => onUpdate({ mode: "crowdfunding" })}
            className={`rounded-lg border-2 p-4 text-left transition-colors ${
              formData.mode === "crowdfunding"
                ? "border-primary-600 bg-primary-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="block font-semibold text-gray-900">Crowdfunding</span>
            <span className="text-sm text-gray-500">Reward-based with tiers</span>
          </button>
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Campaign Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="e.g. Help Build a Community Garden"
          className="input-field mt-1.5"
          maxLength={200}
        />
        <p className="mt-1 text-xs text-gray-500">{formData.title.length}/200 characters</p>
      </div>

      {/* Short Description */}
      <div>
        <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700">
          Short Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="shortDescription"
          value={formData.shortDescription}
          onChange={(e) => onUpdate({ shortDescription: e.target.value })}
          placeholder="A brief summary that appears in campaign cards (1-2 sentences)"
          rows={3}
          className="input-field mt-1.5 resize-none"
          maxLength={500}
        />
        <p className="mt-1 text-xs text-gray-500">{formData.shortDescription.length}/500 characters</p>
      </div>

      {/* Full Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Full Description
        </label>
        <div className="mt-1.5 rounded-lg border border-gray-300">
          <div className="flex gap-1 border-b border-gray-200 px-2 py-1">
            <button type="button" className="rounded px-2 py-1 text-sm font-bold hover:bg-gray-100" title="Bold">
              B
            </button>
            <button type="button" className="rounded px-2 py-1 text-sm italic hover:bg-gray-100" title="Italic">
              I
            </button>
            <button type="button" className="rounded px-2 py-1 text-sm underline hover:bg-gray-100" title="Underline">
              U
            </button>
            <span className="mx-1 border-r border-gray-200" />
            <button type="button" className="rounded px-2 py-1 text-sm hover:bg-gray-100" title="Heading">
              H1
            </button>
            <button type="button" className="rounded px-2 py-1 text-sm hover:bg-gray-100" title="List">
              • List
            </button>
            <button type="button" className="rounded px-2 py-1 text-sm hover:bg-gray-100" title="Link">
              🔗
            </button>
          </div>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Tell your story in detail. Why are you raising funds? How will the money be used?"
            rows={10}
            className="w-full rounded-b-lg px-3 py-2 text-sm focus:outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">Supports basic formatting</p>
      </div>

      {/* Featured Image */}
      <div>
        <FileUpload
          value={formData.featuredImagePreview || ""}
          onChange={(url) => onUpdate({ featuredImagePreview: url })}
          label="Featured Image"
          accept="image/*"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      {/* Video URL */}
      <div>
        <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700">
          Campaign Video URL
        </label>
        <input
          id="videoUrl"
          type="url"
          value={formData.videoUrl}
          onChange={(e) => onUpdate({ videoUrl: e.target.value })}
          placeholder="https://youtube.com/watch?v=..."
          className="input-field mt-1.5"
        />
        <p className="mt-1 text-xs text-gray-500">YouTube or Vimeo URL (optional)</p>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Category
        </label>
        <select
          id="category"
          value={formData.categoryId}
          onChange={(e) => onUpdate({ categoryId: e.target.value })}
          className="input-field mt-1.5"
        >
          <option value="">Select a category</option>
          <option value="education">Education</option>
          <option value="health">Health</option>
          <option value="environment">Environment</option>
          <option value="community">Community</option>
          <option value="arts">Arts & Culture</option>
          <option value="technology">Technology</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Tags</label>
        <div className="mt-1.5 flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
            placeholder="Add a tag and press Enter"
            className="input-field flex-1"
          />
          <button type="button" onClick={handleAddTag} className="btn-secondary">
            Add
          </button>
        </div>
        {formData.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-700"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-primary-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
