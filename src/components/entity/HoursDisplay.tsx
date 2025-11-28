interface HoursDisplayProps {
  hours: Record<string, { open?: string; close?: string; closed?: boolean }>;
}

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export function HoursDisplay({ hours }: HoursDisplayProps) {
  if (!hours || Object.keys(hours).length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Hours
      </h2>
      <div className="space-y-2">
        {DAYS.map((day) => {
          const dayHours = hours[day.key];
          if (!dayHours) return null;

          const isClosed = dayHours.closed === true;
          const hasHours = dayHours.open && dayHours.close;

          return (
            <div
              key={day.key}
              className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0"
            >
              <span className="text-sm font-medium text-gray-700">
                {day.label}
              </span>
              <span className="text-sm text-gray-600">
                {isClosed
                  ? "Closed"
                  : hasHours
                  ? `${dayHours.open} - ${dayHours.close}`
                  : "Hours not specified"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

