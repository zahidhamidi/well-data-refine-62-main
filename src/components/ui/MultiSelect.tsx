import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";

type Option = {
  label: string;
  value: string;
};

type MultiSelectProps = {
  options: Option[];
  selectedValues: string[];
  onSelect: (values: string[]) => void;
  placeholder?: string;
};

export const MultiSelect = ({
  options,
  selectedValues,
  onSelect,
  placeholder = "Select...",
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onSelect(newValues);
  };

  const getButtonText = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    }
    return selectedValues
      .map((value) => options.find((opt) => opt.value === value)?.label)
      .join(", ");
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center justify-between w-full px-4 py-2 text-sm text-left bg-card border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{getButtonText()}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-auto">
          {options.map((option) => (
            <div
              key={option.value}
              className="flex items-center p-2 cursor-pointer hover:bg-muted"
              onClick={() => handleToggle(option.value)}
            >
              <div
                className={`w-4 h-4 border border-border rounded flex items-center justify-center mr-2 transition-colors ${
                  selectedValues.includes(option.value)
                    ? "bg-primary text-primary-foreground"
                    : "bg-background"
                }`}
              >
                {selectedValues.includes(option.value) && <Check className="w-3 h-3" />}
              </div>
              <span>{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};