import { createTraktClient } from "@/lib/trakt";
import { fetchTmdbImages } from "@/lib/tmdb";
import { ExploreGrid, type ExploreItem } from "../explore-grid";

interface Props {
	searchParams: Promise<{ page?: string; type?: string; genres?: string; years?: string }>;
}

type AnticipatedMovie = {
	list_count: number;
	movie: {
		title?: string;
		year?: number;
		rating?: number;
		genres?: string[];
		ids?: { slug?: string; tmdb?: number; trakt?: number };
	};
};

type AnticipatedShow = {
	list_count: number;
	show: {
		title?: string;
		year?: number;
		rating?: number;
		genres?: string[];
		ids?: { slug?: string; tmdb?: number; trakt?: number };
	};
};

export default async function AnticipatedPage({ searchParams }: Props) {
	const sp = await searchParams;
	const page = parseInt(sp.page ?? "1", 10);
	const type = sp.type ?? "all";
	const genres = sp.genres ?? "";
	const years = sp.years ?? "";
	const limit = 42;

	const client = createTraktClient();
	const query = {
		page,
		limit,
		extended: "full" as const,
		...(genres ? { genres } : {}),
		...(years ? { years } : {}),
	};

	const fetchMovies = type !== "shows";
	const fetchShows = type !== "movies";

	const [moviesRes, showsRes] = await Promise.all([
		fetchMovies
			? client.movies.anticipated({ query })
			: Promise.resolve({ status: 200 as const, body: [], headers: new Headers() }),
		fetchShows
			? client.shows.anticipated({ query })
			: Promise.resolve({ status: 200 as const, body: [], headers: new Headers() }),
	]);

	const movies = moviesRes.status === 200 ? (moviesRes.body as unknown as AnticipatedMovie[]) : [];
	const shows = showsRes.status === 200 ? (showsRes.body as unknown as AnticipatedShow[]) : [];

	const moviePages = parseInt(
		String(moviesRes.headers.get?.("x-pagination-page-count") ?? "1"),
		10,
	);
	const showPages = parseInt(String(showsRes.headers.get?.("x-pagination-page-count") ?? "1"), 10);
	const totalPages = Math.max(moviePages, showPages);

	const allItems = [
		...movies.map((m) => ({ type: "movies" as const, data: m.movie, listCount: m.list_count })),
		...shows.map((s) => ({ type: "shows" as const, data: s.show, listCount: s.list_count })),
	].sort((a, b) => b.listCount - a.listCount);

	const images = await Promise.all(
		allItems.map((item) => {
			const tmdbId = item.data.ids?.tmdb;
			const tmdbType = item.type === "movies" ? "movie" : "tv";
			return tmdbId
				? fetchTmdbImages(tmdbId, tmdbType as "movie" | "tv")
				: Promise.resolve({ poster: null, backdrop: null });
		}),
	);

	const items: ExploreItem[] = allItems.map((item, i) => ({
		title: item.data.title ?? "Unknown",
		year: item.data.year,
		rating: item.data.rating,
		href:
			item.type === "movies" ? `/movies/${item.data.ids?.slug}` : `/shows/${item.data.ids?.slug}`,
		posterUrl: images[i]?.poster ?? null,
		backdropUrl: images[i]?.backdrop ?? null,
		mediaType: item.type,
		ids: item.data.ids ?? {},
		genres: item.data.genres ?? [],
	}));

	return (
		<ExploreGrid
			items={items}
			currentPage={page}
			totalPages={totalPages}
			basePath="/explore/anticipated"
			activeType={type}
			activeGenre={genres}
			activeYear={years}
		/>
	);
}
