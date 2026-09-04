export interface DonorInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface Props {
  info: DonorInfo;
  onChange: (info: DonorInfo) => void;
}

export function DonationPersonalInfoStep({ info, onChange }: Props) {
  const update = (field: keyof DonorInfo, value: string) => {
    onChange({ ...info, [field]: value });
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Your Information</h3>
        <p className="mt-1 text-sm text-gray-500">We need your details to send your receipt</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={info.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            required
            className="input-field"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={info.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            required
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={info.email}
          onChange={(e) => update("email", e.target.value)}
          required
          placeholder="you@example.com"
          className="input-field"
        />
        <p className="mt-1 text-xs text-gray-400">Receipt will be sent to this email</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone</label>
        <input
          type="tel"
          value={info.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="+1 (555) 000-0000"
          className="input-field"
        />
      </div>
    </div>
  );
}
