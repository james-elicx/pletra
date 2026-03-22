"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { traktKeys } from "@/lib/queries/keys";

interface WatchStatusProps {
	mediaType: "movies" | "episodes";
	ids: Record<string, unknown>;
	initialWatched: boolean;
	/** Number of plays (watches), shown for movies */
	plays?: number;
	/** Last watched date string */
	lastWatchedAt?: string | null;
	/** For shows: progress info */
	showProgress?: {
		completed: number;
		aired: number;
	} | null;
}

export function WatchStatus({
	mediaType,
	ids,
	initialWatched,
	plays,
	lastWatchedAt,
	showProgress,
}: WatchStatusProps) {
	const [watched, setWatched] = useState(initialWatched);
	const [currentPlays, setCurrentPlays] = useState(plays ?? 0);
	const queryClient = useQueryClient();

	const markWatched = useMutation({
		mutationFn: async () => {
			const res = await fetch("/api/trakt/sync/history", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					[mediaType]: [{ ids, watched_at: new Date().toISOString() }],
				}),
			});
			if (!res.ok) throw new Error("Failed to mark as watched");
			return res.json();
		},
		onSuccess: () => {
			setWatched(true);
			setCurrentPlays((p) => p + 1);
			queryClient.invalidateQueries({ queryKey: traktKeys.history() });
		},
	});

	const removeWatch = useMutation({
		mutationFn: async () => {
			const res = await fetch("/api/trakt/sync/history/remove", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					[mediaType]: [{ ids }],
				}),
			});
			if (!res.ok) throw new Error("Failed to remove from history");
			return res.json();
		},
		onSuccess: () => {
			setWatched(false);
			setCurrentPlays(0);
			queryClient.invalidateQueries({ queryKey: traktKeys.history() });
		},
	});

	const isPending = markWatched.isPending || removeWatch.isPending;

	// Show progress display
	if (showProgress) {
		const pct =
			showProgress.aired > 0 ? Math.round((showProgress.completed / showProgress.aired) * 100) : 0;
		const isComplete = showProgress.completed >= showProgress.aired && showProgress.aired > 0;

		return (
			<div className="flex items-center gap-3">
				<div className="flex items-center gap-2">
					<div
						className={`flex h-8 w-8 items-center justify-center rounded-full ${
							isComplete ? "bg-green-500/15 text-green-400" : "bg-white/5 text-zinc-400"
						}`}
					>
						{isComplete ? (
							<svg
								className="h-4 w-4"
								fill="none"
								stroke="currentColor"
								strokeWidth={2.5}
								viewBox="0 0 24 24"
							>
								<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						) : (
							<span className="text-[11px] font-bold">{pct}%</span>
						)}
					</div>
					<div className="text-sm">
						<span className={isComplete ? "font-medium text-green-400" : "text-zinc-300"}>
							{isComplete
								? "Watched"
								: `${showProgress.completed} / ${showProgress.aired} episodes`}
						</span>
					</div>
				</div>
				{/* Progress bar */}
				{!isComplete && showProgress.aired > 0 && (
					<div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-800">
						<div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
					</div>
				)}
			</div>
		);
	}

	// For movies/episodes: watched toggle
	return (
		<div className="flex items-center gap-2">
			{watched ? (
				<>
					<div className="flex items-center gap-2 text-sm">
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/15 text-green-400">
							<svg
								className="h-4 w-4"
								fill="none"
								stroke="currentColor"
								strokeWidth={2.5}
								viewBox="0 0 24 24"
							>
								<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<div>
							<span className="font-medium text-green-400">Watched</span>
							{currentPlays > 1 && <span className="ml-1.5 text-zinc-500">{currentPlays}x</span>}
							{lastWatchedAt && (
								<p className="text-[11px] text-zinc-500">{formatRelativeDate(lastWatchedAt)}</p>
							)}
						</div>
					</div>
					<button
						onClick={() => removeWatch.mutate()}
						disabled={isPending}
						className="ml-2 cursor-pointer rounded-lg px-2.5 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
						title="Remove from history"
					>
						{removeWatch.isPending ? "Removing..." : "Unwatch"}
					</button>
				</>
			) : (
				<button
					onClick={() => markWatched.mutate()}
					disabled={isPending}
					className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
				>
					<svg
						className="h-4 w-4"
						fill="none"
						stroke="currentColor"
						strokeWidth={2}
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
						/>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
					{markWatched.isPending ? "Marking..." : "Mark as watched"}
				</button>
			)}
		</div>
	);
}

function formatRelativeDate(dateStr: string): string {
	const date = new Date(dateStr);
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const days = Math.floor(diff / 86400000);

	if (days < 1) return "Today";
	if (days === 1) return "Yesterday";
	if (days < 7) return `${days} days ago`;
	if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
