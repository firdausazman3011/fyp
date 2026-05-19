"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  disabled?: boolean;
  isPending?: boolean;
};

export function SubmitButton({ label, pendingLabel = "Please wait...", disabled, isPending }: SubmitButtonProps) {
  const { pending: formPending } = useFormStatus();
  const pending = isPending ?? formPending;

  return (
    <Button type="submit" className="w-full" disabled={disabled || pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
