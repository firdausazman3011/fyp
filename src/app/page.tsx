import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">UniConnect</h1>
        <p className="mt-2 text-sm text-slate-600">Choose an authentication action.</p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Sign up
          </Link>
          <Link href="/forgot-password" className="text-center text-sm text-blue-600 hover:text-blue-500">
            Forgot password?
          </Link>
        </div>
      </div>
    </main>
  );
}
