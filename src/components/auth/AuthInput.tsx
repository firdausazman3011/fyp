import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { cn } from "@/lib/utils";

type AuthInputProps = {
  label: string;
  id: string;
  name: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  error?: string | null;
};

export function AuthInput({
  label,
  id,
  name,
  type = "text",
  placeholder,
  autoComplete,
  required,
  value,
  onChange,
  error,
}: AuthInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className={cn("h-10", error && "border-destructive")}
      />
      <FieldError message={error} />
    </div>
  );
}
