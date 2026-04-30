type AuthCardProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-2xl border border-borderUi bg-cardBg p-6 shadow-card sm:p-8">
        <p className="text-center text-xl font-semibold text-primary">UniConnect</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-textPrimary">{title}</h1>
        <p className="mt-2 text-sm text-textSecondary">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
