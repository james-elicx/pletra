"use client";

import { useState } from "react";
import { useWatchlist } from "@/lib/mutations/use-watchlist";

export function WatchlistButton({
	mediaType,
	ids,
	initialInWatchlist = false,
}: {
	mediaType: "movies" | "shows";
	ids: Record<string, unknown>;
	initialInWatchlist?: boolean;
}) {
	const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);
	const watchlist = useWatchlist();

	return (
		<button
			onClick={() => {
				const action = inWatchlist ? "remove" : "add";
				watchlist.mutate(
					{ action, type: mediaType, ids },
					{ onSuccess: () => setInWatchlist(!inWatchlist) },
				);
			}}
			disabled={watchlist.isPending}
			className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
				inWatchlist ? "text-accent hover:text-accent-hover" : "text-zinc-400 hover:text-white"
			} disabled:opacity-50`}
			title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
		>
			<svg
				className="h-4 w-4"
				fill={inWatchlist ? "currentColor" : "none"}
				stroke="currentColor"
				strokeWidth={2}
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
				/>
			</svg>
			{inWatchlist ? "In Watchlist" : "Watchlist"}
		</button>
	);
}
