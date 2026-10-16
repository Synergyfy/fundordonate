interface GreetingHeaderProps {
  name: string;
  subtitle?: string;
}

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function GreetingHeader({ name, subtitle }: GreetingHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        {getTimeOfDayGreeting()}, {name}
      </h1>
      {subtitle ? (
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      ) : null}
    </div>
  );
}
