import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { campaignApi } from "@/services/campaign.service";
import { StepBasicInfo } from "./steps/StepBasicInfo";
import { StepGoalDuration } from "./steps/StepGoalDuration";
import { StepRewards } from "./steps/StepRewards";
import { StepAdditional } from "./steps/StepAdditional";
import { StepPreview } from "./steps/StepPreview";
import type { RewardFormData as RewardManagerFormData } from "./RewardManager";

export interface CampaignFormData {
  // Step 1 - Basic Info
  title: string;
  shortDescription: string;
  description: string;
  featuredImage: File | null;
  featuredImagePreview: string;
  videoUrl: string;
  categoryId: string;
  tags: string[];
  mode: "donation" | "crowdfunding";

  // Step 2 - Goal & Duration
  goalAmount: string;
  currency: string;
  deadline: string;
  platformFee: string;

  // Step 3 - Rewards
  rewards: RewardManagerFormData[];

  // Step 4 - Additional
  collaboratorIds: string[];
  commentSettings: "everyone" | "backers" | "disabled";
  faqs: FaqFormData[];
  socialSharing: boolean;

  // Campaign Hierarchy
  hierarchyLevel?: string | null;
  locationId?: string | null;
  locationName?: string;
}

export type { RewardManagerFormData as RewardFormData };

export interface FaqFormData {
  id: string;
  question: string;
  answer: string;
}

const STEPS = [
  { id: 1, label: "Basic Info", description: "Title, description & media" },
  { id: 2, label: "Goal & Duration", description: "Funding target & timeline" },
  { id: 3, label: "Rewards", description: "Reward tiers (crowdfunding)" },
  { id: 4, label: "Settings", description: "Collaborators & options" },
  { id: 5, label: "Preview", description: "Review & publish" },
];

const initialFormData: CampaignFormData = {
  title: "",
  shortDescription: "",
  description: "",
  featuredImage: null,
  featuredImagePreview: "",
  videoUrl: "",
  categoryId: "",
  tags: [],
  mode: "donation",
  goalAmount: "",
  currency: "GBP",
  deadline: "",
  platformFee: "",
  rewards: [],
  collaboratorIds: [],
  commentSettings: "everyone",
  faqs: [],
  socialSharing: true,
};

export function CampaignBuilder() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CampaignFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [campaignId, setCampaignId] = useState<string | null>(null);

  const updateFormData = useCallback((updates: Partial<CampaignFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!formData.title.trim() && !!formData.shortDescription.trim();
      case 2:
        return !!formData.goalAmount && parseInt(formData.goalAmount) > 0 && !!formData.deadline;
      case 3:
        return formData.mode === "donation" || formData.rewards.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 5 && canGoNext()) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const payload = buildPayload(formData);

      if (campaignId) {
        await campaignApi.update(campaignId, payload);
      } else {
        const campaign = await campaignApi.create(payload);
        setCampaignId(campaign.id);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save draft";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async (submitForReview = false) => {
    setIsSubmitting(true);
    setError("");

    try {
      const payload = buildPayload(formData);

      let id = campaignId;
      if (!id) {
        const campaign = await campaignApi.create(payload);
        id = campaign.id;
        setCampaignId(id);
      } else {
        await campaignApi.update(id, payload);
      }

      if (submitForReview) {
        await campaignApi.updateStatus(id, "pending_review");
      } else {
        await campaignApi.updateStatus(id, "published");
      }

      navigate("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to publish campaign";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container-page py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Campaign</h1>
              <p className="text-sm text-gray-500">Set up your campaign in a few steps</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveDraft}
                disabled={isSubmitting}
                className="btn-secondary"
              >
                {isSubmitting ? "Saving..." : "Save Draft"}
              </button>
              <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container-page">
          <nav className="flex">
            {STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                className={`flex-1 border-b-2 px-4 py-4 text-center transition-colors ${
                  step.id === currentStep
                    ? "border-primary-600 text-primary-600"
                    : step.id < currentStep
                      ? "cursor-pointer border-green-500 text-green-600 hover:bg-green-50"
                      : "border-transparent text-gray-400"
                }`}
              >
                <span className="block text-sm font-semibold">
                  {step.id < currentStep ? "✓" : step.id} {step.label}
                </span>
                <span className="hidden text-xs text-gray-500 sm:block">{step.description}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="container-page mt-4">
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Step Content */}
      <div className="container-page py-8">
        <div className="mx-auto max-w-3xl">
          {currentStep === 1 && (
            <StepBasicInfo formData={formData} onUpdate={updateFormData} />
          )}
          {currentStep === 2 && (
            <StepGoalDuration formData={formData} onUpdate={updateFormData} />
          )}
          {currentStep === 3 && (
            <StepRewards formData={formData} onUpdate={updateFormData} />
          )}
          {currentStep === 4 && (
            <StepAdditional formData={formData} onUpdate={updateFormData} />
          )}
          {currentStep === 5 && (
            <StepPreview formData={formData} />
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
        <div className="container-page flex items-center justify-between py-4">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="btn-secondary"
          >
            Back
          </button>

          <div className="flex items-center gap-3">
            {currentStep === 5 ? (
              <>
                <button
                  onClick={() => handlePublish(true)}
                  disabled={isSubmitting}
                  className="btn-secondary"
                >
                  Submit for Review
                </button>
                <button
                  onClick={() => handlePublish(false)}
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  Publish Now
                </button>
              </>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canGoNext()}
                className="btn-primary"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function buildPayload(formData: CampaignFormData) {
  return {
    title: formData.title,
    shortDescription: formData.shortDescription,
    description: formData.description,
    goalAmount: parseInt(formData.goalAmount) || 0,
    deadline: formData.deadline,
    mode: formData.mode,
    categoryId: formData.categoryId || undefined,
    hierarchyLevel: formData.hierarchyLevel || undefined,
    locationId: formData.locationId || undefined,
  };
}
