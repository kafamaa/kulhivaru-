"use client";

export function ErrorStatePanel({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-8 backdrop-blur-md text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10">
        <span className="text-xl">!</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-red-100">
        Couldn’t load tournaments
      </h3>
      <p className="mt-2 text-sm text-red-200/90">
        {message}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center rounded-2xl bg-red-500/20 border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/25"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

