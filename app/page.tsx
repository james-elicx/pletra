import { Suspense } from "react";
import { ContinueWatching } from "@/components/dashboard/continue-watching";
import { StartWatching } from "@/components/dashboard/start-watching";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { UpcomingSchedule } from "@/components/dashboard/upcoming-schedule";
import { ProfileBackdrop } from "@/components/dashboard/profile-backdrop";
import { Skeleton } from "@/components/ui/skeleton";

function GridSkeleton({ rows = 3, poster = false }: { rows?: number; poster?: boolean }) {
	return (
		<div>
			<div className="mb-3 flex items-center gap-3">
				<div className="skeleton h-4 w-32 rounded" />
				<div className="h-px flex-1 bg-zinc-800" />
			</div>
			<div
				className={
					poster
						? "grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
						: "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
				}
			>
				{Array.from({ length: (poster ? 7 : 6) * rows }).map((_, i) => (
					<Skeleton key={i} className={`w-full ${poster ? "aspect-[2/3]" : "aspect-[16/10]"}`} />
				))}
			</div>
		</div>
	);
}

export default function DashboardPage() {
	return (
		<>
			<Suspense fallback={null}>
				<ProfileBackdrop />
			</Suspense>

			<div className="relative mx-auto max-w-7xl space-y-8 px-4 pt-6">
				<Suspense fallback={<GridSkeleton rows={3} />}>
					<ContinueWatching />
				</Suspense>

				<Suspense fallback={<GridSkeleton rows={1} poster />}>
					<StartWatching />
				</Suspense>

				<Suspense fallback={<GridSkeleton rows={2} />}>
					<UpcomingSchedule />
				</Suspense>

				<Suspense fallback={<GridSkeleton rows={2} />}>
					<RecentActivity />
				</Suspense>
			</div>
		</>
	);
}
