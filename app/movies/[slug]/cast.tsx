import Image from "next/image";
import Link from "@/components/ui/link";
import { createTraktClient } from "@/lib/trakt";

const TMDB_IMAGE = "https://image.tmdb.org/t/p";

async function fetchPersonImage(tmdbId: number): Promise<string | null> {
	try {
		const res = await fetch(
			`https://api.themoviedb.org/3/person/${tmdbId}?api_key=${process.env.TMDB_API_KEY}`,
			{ next: { revalidate: 86400 } },
		);
		if (!res.ok) return null;
		const data = await res.json<{ profile_path?: string }>();
		return data.profile_path ? `${TMDB_IMAGE}/w185${data.profile_path}` : null;
	} catch {
		return null;
	}
}

export async function CastSection({ slug }: { slug: string }) {
	const client = createTraktClient();
	const res = await client.movies.people({ params: { id: slug } });
	if (res.status !== 200) return null;

	type CastMember = {
		character?: string;
		characters?: string[];
		person?: { name?: string; ids?: { trakt?: number; slug?: string; tmdb?: number } };
	};

	const body = res.body as { cast?: CastMember[] };
	const cast = body.cast?.slice(0, 20) ?? [];
	if (cast.length === 0) return null;

	const photos = await Promise.all(
		cast.map((m) =>
			m.person?.ids?.tmdb ? fetchPersonImage(m.person.ids.tmdb) : Promise.resolve(null),
		),
	);

	return (
		<div>
			<h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-200">Cast</h3>
			<div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
				{cast.map((member, i) => (
					<Link
						key={member.person?.ids?.trakt}
						href={`/people/${member.person?.ids?.slug ?? member.person?.ids?.trakt}`}
						className="group relative w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-900"
					>
						<div className="relative aspect-[3/4]">
							{photos[i] ? (
								<Image
									src={photos[i]!}
									alt={member.person?.name ?? ""}
									fill
									className="object-cover transition-transform group-hover:scale-105"
									sizes="112px"
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
