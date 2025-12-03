"use client";

import { useCallback } from "react";
import type { BusinessHours } from "@/types";

interface DayHours {
  open: string;
  close: string;
  closed?: boolean;
}

interface BusinessHoursInputProps {
  /** Current hours value */
  value: BusinessHours;
  /** Callback when hours change */
  onChange: (hours: BusinessHours) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
}

const DAYS = [
  { key: "monday", label: "Monday", short: "Mon" },
  { key: "tuesday", label: "Tuesday", short: "Tue" },
  { key: "wednesday", label: "Wednesday", short: "Wed" },
  { key: "thursday", label: "Thursday", short: "Thu" },
  { key: "friday", label: "Friday", short: "Fri" },
  { key: "saturday", label: "Saturday", short: "Sat" },
  { key: "sunday", label: "Sunday", short: "Sun" },
] as const;

/**
 * Default hours for a new day entry
 */
const DEFAULT_HOURS: DayHours = {
  open: "09:00",
  close: "17:00",
  closed: false,
};

/**
 * BusinessHoursInput - Day-by-day business hours input component.
 * 
 * Features:
 * - Individual open/close time inputs for each day
 * - "Closed" toggle per day
 * - Copy hours from one day to fill remaining days
 * - Matches the BusinessHours type structure
 */
export function BusinessHoursInput({
  value,
  onChange,
  disabled = false,
}: BusinessHoursInputProps) {
  
  const getDayHours = useCallback((day: string): DayHours => {
    return value[day] || { ...DEFAULT_HOURS };
  }, [value]);

  const updateDay = useCallback((day: string, updates: Partial<DayHours>) => {
    const currentDayHours = getDayHours(day);
    const newDayHours = { ...currentDayHours, ...updates };
    
    onChange({
      ...value,
      [day]: newDayHours,
    });
  }, [value, onChange, getDayHours]);

  const toggleClosed = useCallback((day: string) => {
    const currentDayHours = getDayHours(day);
    updateDay(day, { closed: !currentDayHours.closed });
  }, [getDayHours, updateDay]);

  const copyToRemaining = useCallback((fromDay: string) => {
    const sourceHours = getDayHours(fromDay);
    const dayIndex = DAYS.findIndex(d => d.key === fromDay);
    
    const newHours = { ...value };
    for (let i = dayIndex + 1; i < DAYS.length; i++) {
      newHours[DAYS[i].key] = { ...sourceHours };
    }
    
    onChange(newHours);
  }, [value, onChange, getDayHours]);

  const hasAnyHours = Object.keys(value).length > 0;

  return (
    <div className="space-y-3">
      {/* Quick Actions */}
      {!disabled && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              const standardHours: BusinessHours = {};
              DAYS.forEach((day, i) => {
                if (i < 5) {
                  // Mon-Fri
                  standardHours[day.key] = { open: "09:00", close: "17:00", closed: false };
                } else {
                  // Sat-Sun
                  standardHours[day.key] = { open: "", close: "", closed: true };
                }
              });
              onChange(standardHours);
            }}
            className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            Mon-Fri 9-5
          </button>
          <button
            type="button"
            onClick={() => {
              const sevenDays: BusinessHours = {};
              DAYS.forEach((day) => {
                sevenDays[day.key] = { open: "09:00", close: "21:00", closed: false };
              });
              onChange(sevenDays);
            }}
            className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            7 Days 9-9
          </button>
          {hasAnyHours && (
            <button
              type="button"
              onClick={() => onChange({})}
              className="text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50 text-red-600 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      )}

      {/* Day-by-day inputs */}
      <div className="space-y-2">
        {DAYS.map((day, index) => {
          const dayHours = getDayHours(day.key);
          const isClosed = dayHours.closed === true;
          const hasHoursSet = value[day.key] !== undefined;

          return (
            <div
              key={day.key}
              className="flex items-center gap-2 sm:gap-3 py-2 border-b border-gray-100 last:border-0"
            >
              {/* Day Label */}
              <div className="w-12 sm:w-20 flex-shrink-0">
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {day.label}
                </span>
                <span className="text-sm font-medium text-gray-700 sm:hidden">
                  {day.short}
                </span>
              </div>

              {/* Closed Toggle */}
              <label className="flex items-center gap-1.5 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={isClosed}
                  onChange={() => toggleClosed(day.key)}
                  disabled={disabled}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />
                <span className="text-xs text-gray-500">Closed</span>
              </label>

              {/* Time Inputs */}
              <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                <input
                  type="time"
                  value={isClosed ? "" : dayHours.open}
                  onChange={(e) => updateDay(day.key, { open: e.target.value })}
                  disabled={disabled || isClosed}
                  className="w-full sm:w-28 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
                  aria-label={`${day.label} open time`}
                />
                <span className="text-gray-400 text-sm">–</span>
                <input
                  type="time"
                  value={isClosed ? "" : dayHours.close}
                  onChange={(e) => updateDay(day.key, { close: e.target.value })}
                  disabled={disabled || isClosed}
                  className="w-full sm:w-28 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
                  aria-label={`${day.label} close time`}
                />
              </div>

              {/* Copy to remaining button */}
              {!disabled && hasHoursSet && index < DAYS.length - 1 && (
                <button
                  type="button"
                  onClick={() => copyToRemaining(day.key)}
                  className="flex-shrink-0 text-xs text-indigo-600 hover:text-indigo-700 hover:underline hidden sm:inline"
                  title="Copy these hours to all days below"
                >
                  Copy ↓
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-500 mt-2">
        Leave hours blank or check &quot;Closed&quot; for days you&apos;re not open.
      </p>
    </div>
  );
}
