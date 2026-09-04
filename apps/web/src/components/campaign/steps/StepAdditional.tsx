import { useState } from "react";
import type { CampaignFormData, FaqFormData } from "../CampaignBuilder";

interface Props {
  formData: CampaignFormData;
  onUpdate: (updates: Partial<CampaignFormData>) => void;
}

let faqIdCounter = 0;
function getNextFaqId() {
  return `faq-${++faqIdCounter}-${Date.now()}`;
}

export function StepAdditional({ formData, onUpdate }: Props) {
  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newFaqAnswer, setNewFaqAnswer] = useState("");

  const addFaq = () => {
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return;
    const faq: FaqFormData = {
      id: getNextFaqId(),
      question: newFaqQuestion.trim(),
      answer: newFaqAnswer.trim(),
    };
    onUpdate({ faqs: [...formData.faqs, faq] });
    setNewFaqQuestion("");
    setNewFaqAnswer("");
  };

  const removeFaq = (id: string) => {
    onUpdate({ faqs: formData.faqs.filter((f) => f.id !== id) });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Additional Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure collaboration, comments, FAQs, and social sharing.
        </p>
      </div>

      {/* Comment Settings */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Comment Settings</label>
        <p className="mt-1 text-xs text-gray-500">Choose who can comment on your campaign.</p>
        <div className="mt-3 space-y-2">
          {[
            { value: "everyone", label: "Everyone", desc: "Any visitor can leave comments" },
            { value: "backers", label: "Backers Only", desc: "Only people who donated/pledged" },
            { value: "disabled", label: "Disabled", desc: "Turn off comments" },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                formData.commentSettings === option.value
                  ? "border-primary-600 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="commentSettings"
                value={option.value}
                checked={formData.commentSettings === option.value}
                onChange={(e) => onUpdate({ commentSettings: e.target.value as any })}
                className="h-4 w-4 text-primary-600"
              />
              <div>
                <span className="block text-sm font-medium text-gray-900">{option.label}</span>
                <span className="text-xs text-gray-500">{option.desc}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Social Sharing */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Social Sharing</label>
            <p className="text-xs text-gray-500">Show social share buttons on your campaign page.</p>
          </div>
          <button
            type="button"
            onClick={() => onUpdate({ socialSharing: !formData.socialSharing })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.socialSharing ? "bg-primary-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.socialSharing ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* FAQ Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Frequently Asked Questions</label>
        <p className="mt-1 text-xs text-gray-500">
          Add FAQs to help potential backers understand your campaign.
        </p>

        {/* Existing FAQs */}
        <div className="mt-3 space-y-3">
          {formData.faqs.map((faq) => (
            <div key={faq.id} className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{faq.question}</p>
                  <p className="mt-1 text-sm text-gray-600">{faq.answer}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFaq(faq.id)}
                  className="ml-2 text-gray-400 hover:text-red-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add FAQ Form */}
        <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-4">
          <div className="space-y-3">
            <input
              type="text"
              value={newFaqQuestion}
              onChange={(e) => setNewFaqQuestion(e.target.value)}
              placeholder="Question"
              className="input-field"
            />
            <textarea
              value={newFaqAnswer}
              onChange={(e) => setNewFaqAnswer(e.target.value)}
              placeholder="Answer"
              rows={3}
              className="input-field resize-none"
            />
            <button
              type="button"
              onClick={addFaq}
              disabled={!newFaqQuestion.trim() || !newFaqAnswer.trim()}
              className="btn-secondary text-sm"
            >
              Add FAQ
            </button>
          </div>
        </div>
      </div>

      {/* Collaborators */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Collaborators</label>
        <p className="mt-1 text-xs text-gray-500">
          Invite team members to help manage this campaign.
        </p>
        <div className="mt-3">
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter email to invite collaborator"
              className="input-field flex-1"
            />
            <button type="button" className="btn-secondary">
              Invite
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Collaborators can edit the campaign but cannot delete it or change settings.
          </p>
        </div>
      </div>
    </div>
  );
}
