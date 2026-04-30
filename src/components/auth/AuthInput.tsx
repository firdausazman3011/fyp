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
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-textPrimary">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="w-full rounded-xl border border-borderUi bg-cardBg px-3.5 py-2.5 text-sm text-textPrimary placeholder:text-textSecondary transition hover:border-primary focus:border-primary"
      />
    </div>
  );
}
