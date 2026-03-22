"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { traktKeys } from "@/lib/queries/keys";

interface MarkWatchedParams {
	type: "movies" | "episodes";
	ids: Record<string, unknown>;
}

export function useMarkWatched() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ type, ids }: MarkWatchedParams) => {
			const res = await fetch("/api/trakt/sync/history", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					[type]: [{ ids, watched_at: new Date().toISOString() }],
				}),
			});
			if (!res.ok) throw new Error("Failed to mark as watched");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: traktKeys.upNext() });
			queryClient.invalidateQueries({ queryKey: traktKeys.history() });
		},
	});
}
