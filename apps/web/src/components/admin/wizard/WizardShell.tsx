// =============================================================================
// WizardShell — Campaign Wizard Navigation Shell
// Provides the persistent progress indicator, back/next/save footer,
// and clickable step navigation for the admin campaign wizard.
// =============================================================================

import { type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Globe,
  MapPin,
  FileText,
  Users,
  Heart,
  Banknote,
  Calendar,
  Shield,
  Gift,
  Eye,
  CheckCircle,
} from "lucide-react";
import type { StepId, StepDef } from "@/types/campaign-wizard";

const STEP_ICONS: Record<string, ReactNode> = {
  Globe: <Globe className="h-4 w-4" />,
  MapPin: <MapPin className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  HandHeart: <Heart className="h-4 w-4" />,
  Pound: <Banknote className="h-4 w-4" />,
  Calendar: <Calendar className="h-4 w-4" />,
  Shield: <Shield className="h-4 w-4" />,
  Gift: <Gift className="h-4 w-4" />,
  Eye: <Eye className="h-4 w-4" />,
  CheckCircle: <CheckCircle className="h-4 w-4" />,
};

interface Props {
  steps: StepDef[];
  currentStep: StepId;
  completedSteps: Set<StepId>;
  stepErrors: Partial<Record<StepId, string[]>>;
  onStepClick: (step: StepId) => void;
  onBack: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  nextDisabled?: boolean;
  saving?: boolean;
  children: ReactNode;
  mode?: "create" | "edit";
}

export function WizardShell({
  steps,
  currentStep,
  completedSteps,
  stepErrors,
  onStepClick,
  onBack,
  onNext,
  onSaveDraft,
  isFirstStep,
  isLastStep,
  nextDisabled = false,
  saving = false,
  children,
  mode = "create",
}: Props) {
  const currentIdx = steps.findIndex((s) => s.id === currentStep);

  function canNavigateToStep(stepId: StepId): boolean {
    const targetIdx = steps.findIndex((s) => s.id === stepId);
    if (targetIdx > currentIdx) return false;
    return completedSteps.has(stepId) || targetIdx === currentIdx;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900">
              {mode === "create" ? "Create Campaign" : "Edit Campaign"}
            </h1>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              Step {currentIdx + 1} of {steps.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Draft"}
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Sidebar: Step Progress ── */}
        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <nav className="sticky top-20 space-y-1">
            {steps.map((step, idx) => {
              const isActive = step.id === currentStep;
              const isCompleted = completedSteps.has(step.id);
              const isAccessible = canNavigateToStep(step.id);
              const hasError = (stepErrors[step.id]?.length ?? 0) > 0;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => isAccessible && onStepClick(step.id)}
                  disabled={!isAccessible}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-primary-50 font-semibold text-primary-700"
                      : isAccessible
                        ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        : "cursor-default text-gray-400"
                  }`}
                >
                  {/* Step Number / Check */}
                  <span
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isActive
                        ? "bg-primary-600 text-white"
                        : isCompleted
                          ? "bg-green-100 text-green-700"
                          : hasError
                            ? "bg-red-100 text-red-600"
                            : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : (
                      idx + 1
                    )}
                  </span>

                  {/* Label + Icon */}
                  <span className="flex items-center gap-2">
                    {STEP_ICONS[step.icon]}
                    <span>{step.shortLabel}</span>
                  </span>

                  {/* Error indicator */}
                  {hasError && !isActive && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-red-400" />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Mobile Step Indicator ── */}
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white px-4 py-2 lg:hidden">
          <div className="flex items-center gap-1 overflow-x-auto">
            {steps.map((step, idx) => (
              <button
                key={step.id}
                type="button"
                onClick={() => canNavigateToStep(step.id) && onStepClick(step.id)}
                disabled={!canNavigateToStep(step.id)}
                className={`flex h-8 min-w-[2rem] flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  step.id === currentStep
                    ? "bg-primary-600 text-white"
                    : completedSteps.has(step.id)
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {completedSteps.has(step.id) ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : (
                  idx + 1
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Main Content ── */}
        <main className="flex-1 pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      {/* ── Footer: Navigation ── */}
      <footer className="sticky bottom-0 z-30 border-t border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onBack}
            disabled={isFirstStep}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center gap-3">
            {!isLastStep ? (
              <button
                type="button"
                onClick={onNext}
                disabled={nextDisabled}
                className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <div className="text-sm text-gray-500">
                Use the buttons above to submit your campaign.
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
