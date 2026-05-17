import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AuthInputProps = {
  label: string;
  id: string;
  name: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
};

export function AuthInput({ label, id, name, type = "text", placeholder, autoComplete, required }: AuthInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type={type} placeholder={placeholder} autoComplete={autoComplete} required={required} className={cn("h-10")} />
    </div>
  );
}
