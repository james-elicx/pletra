"use client";

import { useRate } from "@/lib/mutations/use-rate";
import { StarRating } from "@/components/ui/star-rating";

export function RatingInput({
	mediaType,
	ids,
	currentRating,
}: {
	mediaType: "movies" | "shows" | "episodes";
	ids: Record<string, unknown>;
	currentRating?: number;
}) {
	const rate = useRate();

	return (
		<div className="flex items-center gap-3">
			<span className="text-sm text-muted">Your rating:</span>
			<StarRating
				value={currentRating}
				onChange={(rating) => rate.mutate({ type: mediaType, ids, rating })}
			/>
			{rate.isPending && <span className="text-xs text-muted">Saving...</span>}
		</div>
	);
}
