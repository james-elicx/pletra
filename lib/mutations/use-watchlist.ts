"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { traktKeys } from "@/lib/queries/keys";

interface WatchlistParams {
	action: "add" | "remove";
	type: "movies" | "shows";
	ids: Record<string, unknown>;
}

export function useWatchlist() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ action, type, ids }: WatchlistParams) => {
			const endpoint =
				action === "remove" ? "/api/trakt/sync/watchlist/remove" : "/api/trakt/sync/watchlist";
			const res = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					[type]: [{ ids }],
				}),
			});
			if (!res.ok) throw new Error(`Failed to ${action} watchlist`);
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: traktKeys.watchlist() });
		},
	});
}
