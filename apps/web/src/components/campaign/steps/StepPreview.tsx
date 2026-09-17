import type { CampaignFormData } from "../CampaignBuilder";

interface Props {
  formData: CampaignFormData;
}

export function StepPreview({ formData }: Props) {
  const goalAmount = parseInt(formData.goalAmount) || 0;
  const deadlineDate = formData.deadline ? new Date(formData.deadline) : null;
  const daysLeft = deadlineDate
    ? Math.max(0, Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Preview & Publish</h2>
        <p className="mt-1 text-sm text-gray-500">
          Review your campaign before publishing. Make sure everything looks good.
        </p>
      </div>

      {/* Campaign Preview Card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Featured Image */}
        {formData.featuredImagePreview ? (
          <img
            src={formData.featuredImagePreview}
            alt={formData.title}
            className="h-64 w-full object-cover"
          />
        ) : (
          <div className="flex h-64 w-full items-center justify-center bg-gray-100">
            <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        <div className="p-6">
          {/* Mode Badge */}
          <div className="mb-3">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                formData.mode === "crowdfunding"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {formData.mode === "crowdfunding" ? "Crowdfunding" : "Donation"}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-900">
            {formData.title || "Campaign Title"}
          </h3>

          {/* Short Description */}
          <p className="mt-2 text-gray-600">
            {formData.shortDescription || "No description provided."}
          </p>

          {/* Goal Progress */}
          <div className="mt-6">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-primary-600">
                £0
              </span>
              <span className="text-sm text-gray-500">
                of £{goalAmount.toLocaleString()} goal
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full w-0 rounded-full bg-primary-600 transition-all" />
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 flex gap-6 text-sm">
            <div>
              <span className="font-bold text-gray-900">0</span>
              <span className="ml-1 text-gray-500">
                {formData.mode === "crowdfunding" ? "backers" : "donors"}
              </span>
            </div>
            <div>
              <span className="font-bold text-gray-900">{daysLeft}</span>
              <span className="ml-1 text-gray-500">days to go</span>
            </div>
          </div>

          {/* Tags */}
          {formData.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rewards Preview */}
      {formData.mode === "crowdfunding" && formData.rewards.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-bold text-gray-900">Reward Tiers</h3>
          <div className="space-y-3">
            {formData.rewards.map((reward, index) => (
              <div key={reward.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs text-gray-500">Reward {index + 1}</span>
                    <h4 className="font-medium text-gray-900">{reward.title || "Untitled"}</h4>
                    {reward.description && (
                      <p className="mt-1 text-sm text-gray-600">{reward.description}</p>
                    )}
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    {reward.triggerConfig.mode === "min" && `${reward.triggerConfig.min}+`}
                    {reward.triggerConfig.mode === "range" && `${reward.triggerConfig.min}–${reward.triggerConfig.max}`}
                    {reward.triggerConfig.mode === "exact" && `= ${reward.triggerConfig.exact}`}
                  </span>
                </div>
                <div className="mt-3 flex gap-4 text-xs text-gray-500">
                  {reward.quantityType === "limited" && reward.quantityLimit && <span>Limit: {reward.quantityLimit}</span>}
                  {reward.rewardType && <span className="capitalize">{reward.rewardType}</span>}
                  {reward.fulfilmentType && <span>Fulfilment: {reward.fulfilmentType}</span>}
                  {reward.items.length > 0 && <span>{reward.items.length} item(s)</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQs Preview */}
      {formData.faqs.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-bold text-gray-900">Frequently Asked Questions</h3>
          <div className="space-y-3">
            {formData.faqs.map((faq) => (
              <div key={faq.id} className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900">{faq.question}</h4>
                <p className="mt-2 text-sm text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checklist */}
      <div>
        <h3 className="mb-3 text-lg font-bold text-gray-900">Pre-publish Checklist</h3>
        <div className="space-y-2">
          <CheckItem checked={!!formData.title.trim()} label="Campaign title" />
          <CheckItem checked={!!formData.shortDescription.trim()} label="Short description" />
          <CheckItem checked={goalAmount > 0} label="Funding goal set" />
          <CheckItem checked={!!formData.deadline} label="Deadline set" />
          <CheckItem
            checked={formData.mode === "donation" || formData.rewards.length > 0}
            label={formData.mode === "crowdfunding" ? "At least one reward tier" : "Donation mode (rewards optional)"}
          />
          <CheckItem checked={!!formData.featuredImagePreview} label="Featured image" />
        </div>
      </div>
    </div>
  );
}

function CheckItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-5 w-5 items-center justify-center rounded-full ${
          checked ? "bg-green-500" : "bg-gray-300"
        }`}
      >
        {checked && (
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={`text-sm ${checked ? "text-gray-900" : "text-gray-500"}`}>{label}</span>
    </div>
  );
}
