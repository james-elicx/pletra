export function RatingDisplay({
	rating,
	votes,
	size = "lg",
}: {
	rating: number | null | undefined;
	votes?: number | null;
	size?: "sm" | "lg";
}) {
	if (rating == null) return null;

	const percent = Math.round(rating * 10);
	const circumference = 2 * Math.PI * 36;
	const offset = circumference - (percent / 100) * circumference;

	const color =
		percent >= 70
			? "text-green-400 stroke-green-400"
			: percent >= 50
				? "text-yellow-400 stroke-yellow-400"
				: "text-red-400 stroke-red-400";

	if (size === "sm") {
		return (
			<div className="flex items-center gap-1.5">
				<span className={`text-sm font-bold ${color.split(" ")[0]}`}>{percent}%</span>
				{votes != null && <span className="text-xs text-muted">({votes.toLocaleString()})</span>}
			</div>
		);
	}

	return (
		<div className="flex items-center gap-3">
			<div className="relative h-16 w-16">
				<svg className="-rotate-90" viewBox="0 0 80 80">
					<circle
						cx="40"
						cy="40"
						r="36"
						fill="none"
						stroke="currentColor"
						strokeWidth="4"
						className="text-zinc-700"
					/>
					<circle
						cx="40"
						cy="40"
						r="36"
						fill="none"
						strokeWidth="4"
						strokeLinecap="round"
						strokeDasharray={circumference}
						strokeDashoffset={offset}
						className={color}
					/>
				</svg>
				<div className="absolute inset-0 flex items-center justify-center">
					<span className={`text-sm font-bold ${color.split(" ")[0]}`}>{percent}%</span>
				</div>
			</div>
			{votes != null && <div className="text-sm text-muted">{votes.toLocaleString()} votes</div>}
		</div>
	);
}
