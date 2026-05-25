import { useState } from "react";
import { SelectField } from "@/components/atoms";
import { SelectPickerScreen, type SelectOption } from "@/components/molecules";

interface CategoryPickerProps {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  selectedValueLabel: string;
  options: SelectOption[];
  error?: string;
  onSelect: (value: string, label: string, accentColor?: string) => void;
  accentColor?: string;
  valueHint?: string;
}

export function CategoryPicker({
  id,
  label,
  placeholder = "Ketuk untuk pilih...",
  value,
  selectedValueLabel,
  options,
  error,
  onSelect,
  accentColor,
  valueHint,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <SelectField
        id={id}
        label={label}
        placeholder={placeholder}
        value={selectedValueLabel || undefined}
        error={error}
        accentColor={accentColor}
        valueHint={valueHint}
        onClick={() => setOpen(true)}
      />

      {open && (
        <div className="absolute inset-0 z-[70]">
          <SelectPickerScreen
            title={`Pilih ${label}`}
            options={options}
            selectedValue={value}
            emptyMessage="Belum ada pilihan."
            onSelect={(val: string, opt: SelectOption) => {
              onSelect(val, opt.label, opt.accentColor);
              setOpen(false);
            }}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </>
  );
}
