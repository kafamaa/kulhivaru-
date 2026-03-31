"use client";

export function MatchErrorState({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-red-400/20 bg-red-500/10 p-10 text-center backdrop-blur-md">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-3xl border border-red-400/20 bg-red-500/10 text-red-100">
        !
      </div>
      <h3 className="mt-4 text-xl font-semibold text-red-100">
        Couldn’t load matches
      </h3>
      <p className="mt-2 text-sm text-red-200/90">{message}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center rounded-2xl bg-red-500/20 border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/25"
        >
          Retry
        </button>
        <a
          href="/explore"
          className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
        >
          Go to Explore
        </a>
      </div>
    </div>
  );
}

