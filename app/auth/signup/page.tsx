import Link from "next/link";
import { SignupForm } from "@/src/features/auth/components/signup-form";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-50">Create account</h1>
        <p className="mt-1 text-sm text-slate-400">
          Sign up to create and manage tournaments on Kulhivaru+.
        </p>
      </div>
      <SignupForm />
      <p className="text-center text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-300">
          ← Back to homepage
        </Link>
      </p>
    </div>
  );
}
