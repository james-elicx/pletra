import { NextRequest, NextResponse } from "next/server";

const TRAKT_API_BASE = "https://api.trakt.tv";

export async function GET(req: NextRequest) {
	const query = req.nextUrl.searchParams.get("query");
	const type = req.nextUrl.searchParams.get("type") || "movie,show";

	if (!query || query.length < 2) {
		return NextResponse.json([]);
	}

	const traktUrl = `${TRAKT_API_BASE}/search/${type}?query=${encodeURIComponent(query)}&extended=full&limit=12`;

	const res = await fetch(traktUrl, {
		headers: {
			"Content-Type": "application/json",
			"trakt-api-version": "2",
			"trakt-api-key": process.env.TRAKT_CLIENT_ID!,
			"user-agent": "trakr-client/1.0",
		},
	});

	if (!res.ok) {
		return NextResponse.json([], { status: res.status });
	}

	const data = await res.json<Record<string, unknown>[]>();

	// Fetch TMDB poster images in parallel
	const results = await Promise.all(
		data.map(async (item: Record<string, unknown>) => {
			const mediaType = item.type as string;
			const media = item[mediaType] as Record<string, unknown> | undefined;
			if (!media) return null;

			const ids = media.ids as Record<string, unknown> | undefined;
			const tmdbId = ids?.tmdb as number | undefined;
			let posterUrl: string | null = null;

			if (tmdbId) {
				try {
					const tmdbType = mediaType === "show" ? "tv" : mediaType;
					const tmdbRes = await fetch(
						`https://api.themoviedb.org/3/${tmdbType}/${tmdbId}?api_key=${process.env.TMDB_API_KEY}`,
						{ next: { revalidate: 86400 } },
					);
					if (tmdbRes.ok) {
						const tmdbData = await tmdbRes.json<{ poster_path?: string }>();
						if (tmdbData.poster_path) {
							posterUrl = `https://image.tmdb.org/t/p/w185${tmdbData.poster_path}`;
						}
					}
				} catch {
					// ignore
				}
			}

			return {
				type: mediaType,
				title: media.title as string,
				year: media.year as number | undefined,
				slug: ids?.slug as string,
				overview: media.overview as string | undefined,
				rating: media.rating as number | undefined,
				posterUrl,
			};
		}),
	);

	return NextResponse.json(results.filter(Boolean));
}
