"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminCreateOrganizationAction } from "../actions/admin-organization-actions";

export function AdminCreateOrganizationDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [reason, setReason] = useState("");

  if (!open) return null;

  const submit = () => {
    if (!name.trim()) {
      alert("Name is required");
      return;
    }
    if (!reason.trim()) {
      alert("Audit reason is required");
      return;
    }
    start(async () => {
      const res = await adminCreateOrganizationAction({
        name: name.trim(),
        slug: slug.trim(),
        ownerId: ownerId.trim() || null,
        reason: reason.trim(),
      });
      if (!res.ok) {
        alert(res.error);
        return;
      }
      onClose();
      setName("");
      setSlug("");
      setOwnerId("");
      setReason("");
      router.refresh();
      if (res.data?.id) router.push(`/admin/organizations/${res.data.id}`);
    });
  };

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/70"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">Create organization</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Bootstraps an org via secure RPC. Owner is optional (UUID).
        </p>
        <div className="mt-4 space-y-3 text-sm">
          <label className="block space-y-1">
            <span className="text-zinc-400">Name</span>
            <input
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-violet-500/50"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Sports League"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-zinc-400">Slug (optional)</span>
            <input
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-white outline-none focus:border-violet-500/50"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto from name if empty"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-zinc-400">Owner profile id (optional)</span>
            <input
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white outline-none focus:border-violet-500/50"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              placeholder="uuid…"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-zinc-400">Reason (audit)</span>
            <textarea
              className="min-h-[72px] w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-violet-500/50"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why this org is being created"
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={submit}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {pending ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </>
  );
}
