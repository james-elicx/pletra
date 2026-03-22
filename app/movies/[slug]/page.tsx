import { Suspense } from "react";
import Image from "next/image";
import Link from "@/components/ui/link";
import { createTraktClient } from "@/lib/trakt";
import { getAuthenticatedTraktClient } from "@/lib/trakt-server";
import { fetchTmdbImages } from "@/lib/tmdb";
import type { MovieSummary, TraktRating } from "@/lib/types";
import { formatRuntime } from "@/lib/format";
import { Backdrop } from "@/components/media/backdrop";
import { RatingDisplay } from "@/components/media/rating-display";
import { RatingInput } from "@/components/media/rating-input";
import { WatchlistButton } from "@/components/media/watchlist-button";
import { WatchStatus } from "@/components/media/watch-status";
import { Comments } from "@/components/media/comments";
import { Skeleton } from "@/components/ui/skeleton";
import { RelatedMovies } from "./related";
import { CastSection } from "./cast";

interface Props {
	params: Promise<{ slug: string }>;
}

export default async function MoviePage({ params }: Props) {
	const { slug } = await params;
	const client = createTraktClient();

	const [summaryRes, ratingsRes] = await Promise.all([
		client.movies.summary({
			params: { id: slug },
			query: { extended: "full" },
		}),
		client.movies.ratings({
			params: { id: slug },
		}),
	]);

	if (summaryRes.status !== 200) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center text-muted">
				Movie not found.
			</div>
		);
	}

	const movie = summaryRes.body as unknown as MovieSummary;
	const ratings = ratingsRes.status === 200 ? (ratingsRes.body as unknown as TraktRating) : null;

	const images = movie.ids?.tmdb
		? await fetchTmdbImages(movie.ids.tmdb, "movie")
		: { poster: null, backdrop: null };

	let userRating: number | undefined;
	let isWatched = false;
	let watchPlays = 0;
	let lastWatchedAt: string | null = null;
	let isAuthenticated = false;

	try {
		const authClient = await getAuthenticatedTraktClient();
		isAuthenticated = true;

		const [userRatingsRes, historyRes] = await Promise.all([
			authClient.users.ratings.movies({ params: { id: "me" } }),
			authClient.users.history.movies({
				params: { id: "me" },
				query: { page: 1, limit: 50 },
			}),
		]);

		if (userRatingsRes.status === 200) {
			type RatedItem = { movie?: { ids?: { slug?: string } }; rating?: number };
			const rated = (userRatingsRes.body as RatedItem[]).find((r) => r.movie?.ids?.slug === slug);
			userRating = rated?.rating;
		}

		if (historyRes.status === 200) {
			type HistoryItem = {
				watched_at?: string;
				movie?: { ids?: { slug?: string } };
			};
			const watches = (historyRes.body as HistoryItem[]).filter((h) => h.movie?.ids?.slug === slug);
			if (watches.length > 0) {
				isWatched = true;
				watchPlays = watches.length;
				lastWatchedAt = watches[0]?.watched_at ?? null;
			}
		}
	} catch {
		// Not authenticated
	}

	const ratingValue = ratings?.trakt?.rating ?? movie.rating;
	const ratingPercent = ratingValue != null ? Math.round(ratingValue * 10) : null;

	return (
		<>
			<Backdrop src={images.backdrop} alt={movie.title} />

			<div className="relative mx-auto max-w-6xl px-4 pt-6 pb-20">
				{/* Breadcrumb */}
				<nav className="mb-6 flex items-center gap-1.5 text-sm">
					<Link href="/" className="text-zinc-400 transition-colors hover:text-white">
						Home
					</Link>
					<span className="text-zinc-600">›</span>
					<span className="text-zinc-200">{movie.title}</span>
				</nav>

				{/* Hero section */}
				<div className="flex flex-col gap-8 md:flex-row">
					{/* Poster */}
					<div className="flex-shrink-0">
						<div className="relative aspect-[2/3] w-48 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 md:w-56">
							{images.poster ? (
								<Image
									src={images.poster}
									alt={movie.title}
									fill
									className="object-cover"
									priority
									sizes="224px"
								/>
							) : (
								<div className="flex h-full items-center justify-center bg-zinc-800 text-muted">
									🎬
								</div>
							)}
						</div>
					</div>

					{/* Info + Metadata side by side */}
					<div className="flex flex-1 flex-col gap-6 lg:flex-row lg:gap-10">
						{/* Main info */}
						<div className="flex-1 space-y-4">
							<div>
								<h1 className="text-3xl font-bold tracking-tight md:text-4xl">{movie.title}</h1>
								<div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
									{movie.year && <span>{movie.year}</span>}
									{movie.runtime && (
										<>
											<span className="text-zinc-600">·</span>
											<span>{formatRuntime(movie.runtime)}</span>
										</>
									)}
									{movie.certification && (
										<span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[11px]">
											{movie.certification}
										</span>
									)}
								</div>
								{movie.genres && movie.genres.length > 0 && (
									<div className="mt-3 flex flex-wrap gap-1.5">
										{movie.genres.slice(0, 5).map((g) => (
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

							{movie.overview && (
								<p className="max-w-2xl text-sm leading-relaxed text-zinc-300">{movie.overview}</p>
							)}

							{/* Rating + actions */}
							<div className="flex flex-wrap items-center gap-5 pt-1">
								{ratingPercent != null && (
									<RatingDisplay
										rating={ratingValue}
										votes={ratings?.trakt?.votes ?? movie.votes}
										size="lg"
									/>
								)}
								{userRating != null && (
									<div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10">
										<span className="text-xs text-zinc-400">Your rating</span>
										<span className="text-sm font-bold text-yellow-400">★ {userRating}</span>
									</div>
								)}
							</div>

							<div className="flex flex-wrap items-center gap-3">
								<RatingInput mediaType="movies" ids={movie.ids ?? {}} currentRating={userRating} />
								<div className="h-5 w-px bg-zinc-800" />
								<WatchlistButton mediaType="movies" ids={movie.ids ?? {}} />
							</div>

							{isAuthenticated && (
								<WatchStatus
									mediaType="movies"
									ids={movie.ids ?? {}}
									initialWatched={isWatched}
									plays={watchPlays}
									lastWatchedAt={lastWatchedAt}
								/>
							)}
						</div>

						{/* Side metadata */}
						{(movie.released || movie.country || movie.status || movie.certification) && (
							<div className="shrink-0 space-y-3 text-sm lg:w-44">
								{movie.released && (
									<div>
										<span className="text-xs text-zinc-500">Released</span>
										<p className="text-zinc-300">
											{new Date(movie.released).toLocaleDateString("en-US", {
												year: "numeric",
												month: "short",
												day: "numeric",
											})}
										</p>
									</div>
								)}
								{movie.country && (
									<div>
										<span className="text-xs text-zinc-500">Country</span>
										<p className="uppercase text-zinc-300">{movie.country}</p>
									</div>
								)}
								{movie.status && (
									<div>
										<span className="text-xs text-zinc-500">Status</span>
										<p className="capitalize text-zinc-300">{movie.status}</p>
									</div>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Content sections */}
				<div className="mt-12 space-y-10">
					<Suspense fallback={<SectionSkeleton title="Cast" count={8} />}>
						<CastSection slug={slug} />
					</Suspense>

					<Comments mediaType="movies" slug={slug} />

					<Suspense fallback={<SectionSkeleton title="Related" count={6} />}>
						<RelatedMovies slug={slug} />
					</Suspense>
				</div>
			</div>
		</>
	);
}

function SectionSkeleton({ title, count = 1 }: { title: string; count?: number }) {
	return (
		<div className="space-y-3">
			<h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-200">{title}</h3>
			{count > 1 ? (
				<div className="grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8">
					{Array.from({ length: count }).map((_, i) => (
						<Skeleton key={i} className="aspect-[3/4] rounded-lg" />
					))}
				</div>
			) : (
				<Skeleton className="h-24 w-full rounded-xl" />
			)}
		</div>
	);
}
