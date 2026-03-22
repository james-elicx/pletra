"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { traktKeys } from "@/lib/queries/keys";

interface RateParams {
	type: "movies" | "shows" | "episodes";
	ids: Record<string, unknown>;
	rating: number;
}

export function useRate() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ type, ids, rating }: RateParams) => {
			const res = await fetch("/api/trakt/sync/ratings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					[type]: [{ ids, rating, rated_at: new Date().toISOString() }],
				}),
			});
			if (!res.ok) throw new Error("Failed to rate");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: traktKeys.upNext() });
		},
	});
}
