import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Who we are",
    body: "FundOrDonate is a UK platform for funding, campaigns, donations and hub activation. This notice explains how we handle personal information when you use the FundOrDonate website.",
  },
  {
    title: "2. Information we collect",
    body: "We collect information you provide directly — such as your name, email address and the content of messages you send us — as well as basic technical information needed to run the site, such as your browser type and the pages you visit.",
  },
  {
    title: "3. How we use your information",
    body: "We use your information to operate the platform, respond to your enquiries, process contributions you choose to make, keep the service secure and improve the experience for everyone using FundOrDonate.",
  },
  {
    title: "4. Sharing and disclosure",
    body: "We do not sell your personal information. We share it only where necessary to provide the service — for example with payment providers when you make a contribution — or where we are required to do so by law.",
  },
  {
    title: "5. Cookies and local storage",
    body: "The site uses cookies and local storage to keep you signed in, remember your preferences and understand how the site is used. You can control cookies through your browser settings.",
  },
  {
    title: "6. Your rights",
    body: "Under UK data protection law you can request a copy of the personal data we hold about you, ask for corrections, or ask us to delete it. Contact us at hello@fundordonate.com to make a request.",
  },
  {
    title: "7. Data retention",
    body: "We keep personal information only for as long as it is needed for the purposes described here, or for as long as we are required to keep it by law.",
  },
  {
    title: "8. Changes to this policy",
    body: "We may update this privacy notice from time to time. Any changes will be published on this page with an updated date.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-primary-50/60 via-white to-secondary-50/30 py-12 md:py-16">
        <div className="container-page max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-primary-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-primary-700">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            Legal
          </span>
          <h1 className="mt-5 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Privacy Policy</h1>
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
              Questions about your data? Contact us at{" "}
              <a href="mailto:hello@fundordonate.com" className="font-semibold text-primary-600 hover:text-primary-700">
                hello@fundordonate.com
              </a>{" "}
              or read our <Link to="/terms" className="font-semibold text-primary-600 hover:text-primary-700">Terms of Service</Link>.
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
