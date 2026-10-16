import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Acceptance of these terms",
    body: "By using the FundOrDonate website you agree to these terms. If you do not agree, please do not use the site.",
  },
  {
    title: "2. Using the platform",
    body: "FundOrDonate lets people discover funding opportunities, browse and take part in campaigns, make donations and explore UK Hub Activation. You agree to use the site lawfully and not to interfere with its normal operation.",
  },
  {
    title: "3. Accounts",
    body: "Some features require an account. You are responsible for keeping your login details secure and for the activity that takes place under your account.",
  },
  {
    title: "4. Campaigns and contributions",
    body: "Campaigns are created by organisers using the platform. FundOrDonate provides the tools to publish and manage campaigns but is not the creator of third-party campaigns. Contributions are made voluntarily and are subject to the campaign's own stated terms.",
  },
  {
    title: "5. Content",
    body: "You keep ownership of content you submit. By submitting it, you give FundOrDonate the permission needed to display and operate that content as part of the service.",
  },
  {
    title: "6. Availability",
    body: "We work to keep FundOrDonate available, but we do not guarantee uninterrupted access. We may update, suspend or withdraw parts of the service at any time.",
  },
  {
    title: "7. Limitation of liability",
    body: "The site is provided on an “as is” and “as available” basis. To the fullest extent permitted by law, FundOrDonate is not liable for indirect or consequential losses arising from your use of the site.",
  },
  {
    title: "8. Changes to these terms",
    body: "We may update these terms from time to time. Changes will be published on this page with an updated date. Continuing to use the site after changes are published means you accept the revised terms.",
  },
  {
    title: "9. Contact",
    body: "Questions about these terms can be sent to hello@fundordonate.com.",
  },
];

export default function TermsPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-primary-50/60 via-white to-secondary-50/30 py-12 md:py-16">
        <div className="container-page max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-primary-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-primary-700">
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            Legal
          </span>
          <h1 className="mt-5 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Terms of Service</h1>
          <p className="mt-3 text-gray-500">Last updated: September 2026</p>
        </div>
      </section>

      <section className="pb-16 md:pb-24 bg-white">
        <div className="container-page max-w-3xl">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
            <div className="space-y-8">
              {SECTIONS.map((s) => (
                <div key={s.title}>
                  <h2 className="font-bold text-gray-900 mb-2">{s.title}</h2>
                  <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-xl bg-gray-50 border border-gray-100 p-5 text-sm text-gray-600">
              See how we handle your information in our{" "}
              <Link to="/privacy" className="font-semibold text-primary-600 hover:text-primary-700">
                Privacy Policy
              </Link>
              .
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
