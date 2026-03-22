const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function posterUrl(path: string | null | undefined, size = "w500") {
	if (!path) return null;
	return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function backdropUrl(path: string | null | undefined, size = "w1280") {
	if (!path) return null;
	return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

interface TmdbMediaResult {
	poster_path: string | null;
	backdrop_path: string | null;
}

export async function fetchTmdbImages(
	tmdbId: number,
	type: "movie" | "tv",
): Promise<{ poster: string | null; backdrop: string | null }> {
	const res = await fetch(
		`https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${process.env.TMDB_API_KEY}`,
		{ next: { revalidate: 86400 } },
	);

	if (!res.ok) {
		return { poster: null, backdrop: null };
	}

	const data: TmdbMediaResult = await res.json();
	return {
		poster: posterUrl(data.poster_path),
		backdrop: backdropUrl(data.backdrop_path),
	};
}

export async function fetchTmdbEpisodeImages(
	tvId: number,
	season: number,
	episode: number,
): Promise<{ still: string | null }> {
	const res = await fetch(
		`https://api.themoviedb.org/3/tv/${tvId}/season/${season}/episode/${episode}?api_key=${process.env.TMDB_API_KEY}`,
		{ next: { revalidate: 86400 } },
	);

	if (!res.ok) {
		return { still: null };
	}

	const data = await res.json<{ still_path?: string }>();
	return {
		still: data.still_path ? `${TMDB_IMAGE_BASE}/w780${data.still_path}` : null,
	};
}
