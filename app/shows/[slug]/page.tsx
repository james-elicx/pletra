import { Suspense } from "react";
import Image from "next/image";
import Link from "@/components/ui/link";
import { createTraktClient } from "@/lib/trakt";
import { getAuthenticatedTraktClient } from "@/lib/trakt-server";
import { fetchTmdbImages } from "@/lib/tmdb";
import type { ShowSummary, TraktRating } from "@/lib/types";
import { formatRuntime } from "@/lib/format";
import { Backdrop } from "@/components/media/backdrop";
import { RatingDisplay } from "@/components/media/rating-display";
import { RatingInput } from "@/components/media/rating-input";
import { WatchlistButton } from "@/components/media/watchlist-button";
import { WatchStatus } from "@/components/media/watch-status";
import { Comments } from "@/components/media/comments";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
	params: Promise<{ slug: string }>;
}

async function Seasons({ slug, tmdbId }: { slug: string; tmdbId?: number }) {
	const client = createTraktClient();
	const res = await client.shows.seasons({ params: { id: slug }, query: { extended: "full" } });
	if (res.status !== 200) return null;

	type Season = {
		number?: number;
		episode_count?: number;
		aired_episodes?: number;
		rating?: number;
		ids?: { trakt?: number };
	};

	const seasons = (res.body as Season[]).filter((s) => (s.number ?? 0) > 0);
	if (seasons.length === 0) return null;

	const seasonImages = await Promise.all(
		seasons.map(async (s) => {
			if (!tmdbId) return null;
			try {
				const r = await fetch(
					`https://api.themoviedb.org/3/tv/${tmdbId}/season/${s.number}?api_key=${process.env.TMDB_API_KEY}`,
					{ next: { revalidate: 86400 } },
				);
				if (!r.ok) return null;
				const data = await r.json<{ poster_path?: string }>();
				return data.poster_path ? `https://image.tmdb.org/t/p/w300${data.poster_path}` : null;
			} catch {
				return null;
			}
		}),
	);

	return (
		<div>
			<h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-200">
				Seasons
			</h3>
			<div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
				{seasons.map((season, i) => {
					const pct = season.rating ? Math.round(season.rating * 10) : null;
					return (
						<Link
							key={season.number}
							href={`/shows/${slug}/seasons/${season.number}`}
							className="group overflow-hidden rounded-lg bg-zinc-900"
						>
							<div className="relative aspect-[2/3]">
								{seasonImages[i] ? (
									<Image
										src={seasonImages[i]!}
										alt={`Season ${season.number}`}
										fill
										className="object-cover transition-transform group-hover:scale-105"
										sizes="160px"
									/>
								) : (
									<div className="flex h-full items-center justify-center bg-zinc-800 text-2xl font-bold text-zinc-700">
										{season.number}
									</div>
								)}
								{pct != null && pct > 0 && (
									<div className="absolute top-1.5 right-1.5 rounded bg-green-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
										{pct}%
									</div>
								)}
								<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent px-2 pt-10 pb-1.5">
									<p className="text-[11px] font-semibold text-white">Season {season.number}</p>
									<p className="text-[9px] text-zinc-400">
										{season.aired_episodes ?? season.episode_count ?? 0} eps
									</p>
								</div>
							</div>
						</Link>
					);
				})}
			</div>
		</div>
	);
}

async function ShowCast({ slug }: { slug: string }) {
	const client = createTraktClient();
	const res = await client.shows.people({ params: { id: slug } });
	if (res.status !== 200) return null;

	type CastMember = {
		characters?: string[];
		character?: string;
		person?: { name?: string; ids?: { trakt?: number; slug?: string; tmdb?: number } };
	};
	const body = res.body as { cast?: CastMember[] };
	const cast = body.cast?.slice(0, 12) ?? [];
	if (cast.length === 0) return null;

	const photos = await Promise.all(
		cast.map(async (m) => {
			const tmdbId = m.person?.ids?.tmdb;
			if (!tmdbId) return null;
			try {
				const r = await fetch(
					`https://api.themoviedb.org/3/person/${tmdbId}?api_key=${process.env.TMDB_API_KEY}`,
					{ next: { revalidate: 86400 } },
				);
				if (!r.ok) return null;
				const data = await r.json<{ profile_path?: string }>();
				return data.profile_path ? `https://image.tmdb.org/t/p/w185${data.profile_path}` : null;
			} catch {
				return null;
			}
		}),
	);

	return (
		<div>
			<h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-200">Cast</h3>
			<div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
				{cast.map((member, i) => (
					<Link
						key={member.person?.ids?.trakt}
						href={`/people/${member.person?.ids?.slug ?? member.person?.ids?.trakt}`}
						className="group relative overflow-hidden rounded-lg bg-zinc-900"
					>
						<div className="relative aspect-[3/4]">
							{photos[i] ? (
								<Image
									src={photos[i]!}
									alt={member.person?.name ?? ""}
									fill
									className="object-cover transition-transform group-hover:scale-105"
									sizes="120px"
								/>
							) : (
								<div className="flex h-full items-center justify-center bg-zinc-800 text-xl text-zinc-700">
									👤
								</div>
							)}
							<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-1.5 pt-6 pb-1">
								<p className="truncate text-[10px] font-semibold text-white">
									{member.person?.name}
								</p>
								<p className="truncate text-[9px] text-zinc-400">
									{member.characters?.[0] ?? member.character ?? ""}
								</p>
							</div>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}

export default async function ShowPage({ params }: Props) {
	const { slug } = await params;
	const client = createTraktClient();

	const [summaryRes, ratingsRes] = await Promise.all([
		client.shows.summary({ params: { id: slug }, query: { extended: "full" } }),
		client.shows.ratings({ params: { id: slug } }),
	]);

	if (summaryRes.status !== 200) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center text-muted">
				Show not found.
			</div>
		);
	}

	const show = summaryRes.body as unknown as ShowSummary;
	const ratings = ratingsRes.status === 200 ? (ratingsRes.body as unknown as TraktRating) : null;
	const images = show.ids?.tmdb
		? await fetchTmdbImages(show.ids.tmdb, "tv")
		: { poster: null, backdrop: null };

	let userRating: number | undefined;
	let showProgress: { completed: number; aired: number } | null = null;
	let isAuthenticated = false;

	try {
		const authClient = await getAuthenticatedTraktClient();
		isAuthenticated = true;

		const [ratingsRes2, progressRes] = await Promise.all([
			authClient.users.ratings.shows({ params: { id: "me" } }),
			authClient.shows.progress.watched({ params: { id: slug } }),
		]);

		if (ratingsRes2.status === 200) {
			type R = { show?: { ids?: { slug?: string } }; rating?: number };
			userRating = (ratingsRes2.body as R[]).find((r) => r.show?.ids?.slug === slug)?.rating;
		}

		if (progressRes.status === 200) {
			const progress = progressRes.body as { aired?: number; completed?: number };
			if (progress.aired != null && progress.completed != null) {
				showProgress = { completed: progress.completed, aired: progress.aired };
			}
		}
	} catch {
		/* not authenticated */
	}

	const { genres, status } = show;
	const ratingValue = ratings?.trakt?.rating ?? show.rating;

	const statusStyle =
		status === "returning series"
			? "bg-green-500/10 text-green-400 ring-1 ring-green-500/20"
			: status === "ended"
				? "bg-zinc-500/10 text-zinc-500 ring-1 ring-zinc-500/20"
				: "bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20";

	return (
		<>
			<Backdrop src={images.backdrop} alt={show.title} />

			<div className="relative mx-auto max-w-6xl px-4 pt-6 pb-20">
				{/* Breadcrumb */}
				<nav className="mb-6 flex items-center gap-1.5 text-sm">
					<Link href="/" className="text-zinc-400 transition-colors hover:text-white">
						Home
					</Link>
					<span className="text-zinc-600">›</span>
					<span className="text-zinc-200">{show.title}</span>
				</nav>

				{/* Hero */}
				<div className="flex flex-col gap-8 md:flex-row">
					<div className="flex-shrink-0">
						<div className="relative aspect-[2/3] w-48 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 md:w-56">
							{images.poster ? (
								<Image
									src={images.poster}
									alt={show.title}
									fill
									className="object-cover"
									priority
									sizes="224px"
								/>
							) : (
								<div className="flex h-full items-center justify-center bg-zinc-800 text-muted">
									📺
								</div>
							)}
						</div>
					</div>

					{/* Info + metadata */}
					<div className="flex flex-1 flex-col gap-6 lg:flex-row lg:gap-10">
						<div className="flex-1 space-y-4">
							<div>
								<div className="flex flex-wrap items-center gap-3">
									<h1 className="text-3xl font-bold tracking-tight md:text-4xl">{show.title}</h1>
									{status && (
										<span
											className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyle}`}
										>
											{status}
										</span>
									)}
								</div>
								<div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
									{show.year && <span>{String(show.year)}</span>}
									{show.network && (
										<>
											<span className="text-zinc-600">·</span>
											<span>{String(show.network)}</span>
										</>
									)}
									{show.runtime && (
										<>
											<span className="text-zinc-600">·</span>
											<span>{formatRuntime(show.runtime)}/ep</span>
										</>
									)}
								</div>
								{genres && genres.length > 0 && (
									<div className="mt-3 flex flex-wrap gap-1.5">
										{genres.slice(0, 5).map((g) => (
											<span
												key={g}
												className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-zinc-400 ring-1 ring-white/5"
											>
												{g}
											</span>
										))}
									</div>
								)}
							</div>

							{show.overview && (
								<p className="max-w-2xl text-sm leading-relaxed text-zinc-300">{show.overview}</p>
							)}

							<div className="flex flex-wrap items-center gap-5 pt-1">
								<RatingDisplay
									rating={ratingValue}
									votes={ratings?.trakt?.votes ?? show.votes}
									size="lg"
								/>
								{userRating != null && (
									<div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10">
										<span className="text-xs text-zinc-400">Your rating</span>
										<span className="text-sm font-bold text-yellow-400">★ {userRating}</span>
									</div>
								)}
							</div>

							<div className="flex flex-wrap items-center gap-3">
								<RatingInput mediaType="shows" ids={show.ids ?? {}} currentRating={userRating} />
								<div className="h-5 w-px bg-zinc-800" />
								<WatchlistButton mediaType="shows" ids={show.ids ?? {}} />
							</div>

							{isAuthenticated && showProgress && (
								<WatchStatus
									mediaType="episodes"
									ids={show.ids ?? {}}
									initialWatched={false}
									showProgress={showProgress}
								/>
							)}
						</div>

						{/* Side metadata */}
						{(show.first_aired || show.country || show.certification) && (
							<div className="shrink-0 space-y-3 text-sm lg:w-44">
								{show.first_aired && (
									<div>
										<span className="text-xs text-zinc-500">First Aired</span>
										<p className="text-zinc-300">
											{new Date(show.first_aired).toLocaleDateString("en-US", {
												year: "numeric",
												month: "short",
												day: "numeric",
											})}
										</p>
									</div>
								)}
								{show.country && (
									<div>
										<span className="text-xs text-zinc-500">Country</span>
										<p className="uppercase text-zinc-300">{show.country}</p>
									</div>
								)}
								{show.certification && (
									<div>
										<span className="text-xs text-zinc-500">Certification</span>
										<p className="text-zinc-300">{show.certification}</p>
									</div>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Content */}
				<div className="mt-12 space-y-10">
					<Suspense
						fallback={
							<div className="space-y-3">
								<Skeleton className="h-4 w-20" />
								<div className="grid grid-cols-7 gap-3">
									{Array.from({ length: 7 }).map((_, i) => (
										<Skeleton key={i} className="aspect-[2/3]" />
									))}
								</div>
							</div>
						}
					>
						<Seasons slug={slug} tmdbId={show.ids?.tmdb} />
					</Suspense>

					<Suspense
						fallback={
							<div className="space-y-3">
								<Skeleton className="h-4 w-16" />
								<div className="grid grid-cols-8 gap-2">
									{Array.from({ length: 8 }).map((_, i) => (
										<Skeleton key={i} className="aspect-[3/4] rounded-lg" />
									))}
								</div>
							</div>
						}
					>
						<ShowCast slug={slug} />
					</Suspense>

					<Comments mediaType="shows" slug={slug} />
				</div>
			</div>
		</>
	);
}
