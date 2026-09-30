import { useState } from "react";
import { CheckCircle2, Mail, MapPin, MessageSquare, Send, User } from "lucide-react";

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY: FormState = { name: "", email: "", subject: "", message: "" };

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Please enter your name.";
  if (!form.email.trim()) {
    errors.email = "Please enter your email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }
  if (!form.subject.trim()) errors.subject = "Please choose a subject.";
  if (!form.message.trim()) {
    errors.message = "Please enter your message.";
  } else if (form.message.trim().length < 10) {
    errors.message = "Your message must be at least 10 characters.";
  }
  return errors;
}

const SUBJECTS = ["General question", "Funding opportunities", "Campaigns", "UK Hub Activation", "Donations", "Something else"];

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
      {message}
    </p>
  );
}

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    // Frontend-only: simulate sending the message.
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="container-page py-14 md:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em]">
              <Mail className="w-3.5 h-3.5" aria-hidden="true" />
              Contact
            </span>
            <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
              Get in touch
            </h1>
            <p className="mt-4 text-lg text-primary-100 leading-relaxed max-w-2xl">
              Questions about funding, campaigns or the platform? Send us a message and we will
              get back to you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact content */}
      <section className="py-14 md:py-20 bg-white">
        <div className="container-page grid lg:grid-cols-[1fr_380px] gap-10 lg:gap-14 items-start">
          {/* Form / success */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm">
            {submitted ? (
              <div className="text-center py-8" role="status">
                <div className="w-14 h-14 rounded-full bg-secondary-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-secondary-600" aria-hidden="true" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Message sent</h2>
                <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
                  Thanks for getting in touch, {form.name || "friend"}. We have received your
                  message and will reply to {form.email} as soon as we can.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForm(EMPTY);
                    setErrors({});
                    setSubmitted(false);
                  }}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Send a message</h2>
                <p className="text-sm text-gray-500 mb-6">All fields are required.</p>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="contact-name" className="label">
                      Your name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
                      <input
                        id="contact-name"
                        type="text"
                        autoComplete="name"
                        className={`input-field !pl-9 ${errors.name ? "!border-rose-400 focus:!ring-rose-400" : ""}`}
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? "contact-name-error" : undefined}
                        placeholder="Jane Smith"
                      />
                    </div>
                    <FieldError id="contact-name-error" message={errors.name} />
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="label">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
                      <input
                        id="contact-email"
                        type="email"
                        autoComplete="email"
                        className={`input-field !pl-9 ${errors.email ? "!border-rose-400 focus:!ring-rose-400" : ""}`}
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? "contact-email-error" : undefined}
                        placeholder="jane@example.com"
                      />
                    </div>
                    <FieldError id="contact-email-error" message={errors.email} />
                  </div>
                </div>

                <div className="mt-5">
                  <label htmlFor="contact-subject" className="label">
                    Subject
                  </label>
                  <select
                    id="contact-subject"
                    className={`input-field ${errors.subject ? "!border-rose-400 focus:!ring-rose-400" : ""}`}
                    value={form.subject}
                    onChange={(e) => set("subject", e.target.value)}
                    aria-invalid={!!errors.subject}
                    aria-describedby={errors.subject ? "contact-subject-error" : undefined}
                  >
                    <option value="">Choose a subject…</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <FieldError id="contact-subject-error" message={errors.subject} />
                </div>

                <div className="mt-5">
                  <label htmlFor="contact-message" className="label">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={6}
                    className={`input-field resize-y ${errors.message ? "!border-rose-400 focus:!ring-rose-400" : ""}`}
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? "contact-message-error" : undefined}
                    placeholder="How can we help?"
                  />
                  <FieldError id="contact-message-error" message={errors.message} />
                </div>

                <button type="submit" disabled={submitting} className="btn-primary mt-6 inline-flex items-center gap-2 !py-3 !px-6 disabled:opacity-60">
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                      Sending…
                    </>
                  ) : (
                    <>
                      Send message
                      <Send className="w-4 h-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Contact details */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center mb-4">
                <Mail className="w-5 h-5 text-primary-600" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Email</h3>
              <a href="mailto:hello@fundordonate.com" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
                hello@fundordonate.com
              </a>
              <p className="text-xs text-gray-500 mt-2">The quickest way to reach the team.</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5 text-secondary-600" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Before you write</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Common questions about funding, donating and campaigns are answered in our{" "}
                <a href="/about#faq" className="font-semibold text-primary-600 hover:text-primary-700">
                  FAQ
                </a>
                .
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center mb-4">
                <MapPin className="w-5 h-5 text-primary-600" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Based in the UK</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                FundOrDonate supports funding, campaigns and hub activation across the United
                Kingdom.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
