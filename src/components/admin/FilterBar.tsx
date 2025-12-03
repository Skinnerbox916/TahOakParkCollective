import { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface FilterBarProps {
  children: ReactNode;
  onClear?: () => void;
  onApply?: () => void;
}

export function FilterBar({ children, onClear, onApply }: FilterBarProps) {
  return (
    <Card className="mb-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {children}
        </div>
        {(onClear || onApply) && (
          <div className="flex gap-2">
            {onClear && (
              <Button variant="outline" onClick={onClear}>
                Clear
              </Button>
            )}
            {onApply && (
              <Button onClick={onApply}>
                Apply Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}



