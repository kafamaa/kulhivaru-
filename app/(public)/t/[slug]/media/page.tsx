import Link from "next/link";

import { listPublicTournamentMedia, type TournamentMediaSort, type TournamentMediaTypeFilter } from "@/src/features/tournaments/queries/list-public-tournament-media";
import { TournamentMediaGallery } from "@/src/features/tournaments/components/public/tournament-media/tournament-media-gallery";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

type SearchParamsValue = Record<string, string | string[] | undefined>;

function getString(sp: SearchParamsValue | undefined, key: string) {
  if (!sp) return undefined;
  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

function parseType(input: string | undefined): TournamentMediaTypeFilter {
  const v = input ?? "";
  if (v === "all" || v === "videos" || v === "photos" || v === "live" || v === "highlights" || v === "replays") return v;
  return "all";
}

function parseSort(input: string | undefined): TournamentMediaSort {
  const v = input ?? "";
  if (v === "featured" || v === "latest" || v === "oldest") return v;
  return "featured";
}

function parsePage(input: string | undefined) {
  const n = Number(input ?? 1);
  if (Number.isNaN(n) || n < 1) return 1;
  return Math.floor(n);
}

interface TournamentMediaPageProps {
  params: Promise<{ slug: string }>;
  searchParams?:
    | Promise<SearchParamsValue | undefined>
    | SearchParamsValue
    | undefined;
}

export default async function TournamentMediaPage({
  params,
  searchParams,
}: TournamentMediaPageProps) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : undefined;

  const type = parseType(getString(sp, "type"));
  const sort = parseSort(getString(sp, "sort"));
  const page = parsePage(getString(sp, "page"));

  try {
    const supabase = await createSupabaseServerClient();

    const { data: tournamentRow, error: tournamentErr } = await supabase
      .from("public_tournaments")
      .select("name,status")
      .eq("slug", slug)
      .single();

    if (tournamentErr || !tournamentRow) {
      throw new Error("Tournament not found.");
    }

    const list = await listPublicTournamentMedia({
      tournamentSlug: slug,
      type,
      sort,
      page,
      limit: 12,
    });

    const nextPage = page + 1;
    const totalNext = page * list.limit;
    const hasMore = totalNext < list.total;
    const loadMoreHref = hasMore
      ? (() => {
          const params = new URLSearchParams();
          if (type !== "all") params.set("type", type);
          if (sort !== "featured") params.set("sort", sort);
          params.set("page", String(nextPage));
          return `/t/${slug}/media?${params.toString()}`;
        })()
      : null;

    return (
      <TournamentMediaGallery
        slug={slug}
        tournament={{ name: String(tournamentRow.name), status: String(tournamentRow.status) }}
        featured={list.featured}
        items={list.items}
        counts={list.counts}
        page={list.page}
        limit={list.limit}
        total={list.total}
        loadMoreHref={loadMoreHref}
        initialType={type}
        initialSort={sort}
      />
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    const retryParams = new URLSearchParams();
    if (type !== "all") retryParams.set("type", type);
    if (sort !== "featured") retryParams.set("sort", sort);
    retryParams.set("page", String(page));
    const retryHref = `/t/${slug}/media?${retryParams.toString()}`;
    return (
      <div className="mx-auto max-w-5xl px-4 pt-12 pb-20">
        <div className="mx-auto max-w-2xl rounded-3xl border border-red-400/20 bg-red-500/10 p-10 text-center backdrop-blur-md">
          <h3 className="text-2xl font-semibold text-red-100">
            Couldn&apos;t load media
          </h3>
          <p className="mt-2 text-sm text-red-200/90">
            {message}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <Link
              href={retryHref}
              className="inline-flex items-center rounded-2xl bg-red-500/20 border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/25"
            >
              Retry
            </Link>
            <Link
              href={`/t/${slug}`}
              className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              Back to Overview
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

