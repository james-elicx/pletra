"use client";

import Link from "@/components/ui/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

function getTraktUrl(pathname: string): string | null {
	// Map local routes to trakt.tv URLs
	const movieMatch = pathname.match(/^\/movies\/([^/]+)/);
	if (movieMatch) return `https://trakt.tv/movies/${movieMatch[1]}`;

	const episodeMatch = pathname.match(/^\/shows\/([^/]+)\/seasons\/(\d+)\/episodes\/(\d+)/);
	if (episodeMatch)
		return `https://trakt.tv/shows/${episodeMatch[1]}/seasons/${episodeMatch[2]}/episodes/${episodeMatch[3]}`;

	const seasonMatch = pathname.match(/^\/shows\/([^/]+)\/seasons\/(\d+)/);
	if (seasonMatch) return `https://trakt.tv/shows/${seasonMatch[1]}/seasons/${seasonMatch[2]}`;

	const showMatch = pathname.match(/^\/shows\/([^/]+)/);
	if (showMatch) return `https://trakt.tv/shows/${showMatch[1]}`;

	const personMatch = pathname.match(/^\/people\/([^/]+)/);
	if (personMatch) return `https://trakt.tv/people/${personMatch[1]}`;

	return null;
}

export function FloatingNav() {
	const pathname = usePathname();
	const { data: session } = authClient.useSession();
	const router = useRouter();
	const isHome = pathname === "/";
	const traktUrl = getTraktUrl(pathname);

	return (
		<div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
			<nav className="flex items-center gap-1 rounded-full bg-zinc-900/90 px-2 py-1.5 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
				{/* Home */}
				<Link
					href="/"
					className={`flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${
						isHome ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
					}`}
				>
					<svg
						className="h-4 w-4"
						fill="none"
						stroke="currentColor"
						strokeWidth={1.5}
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
						/>
					</svg>
					{isHome && "Home"}
				</Link>

				{/* Divider */}
				<div className="h-5 w-px bg-zinc-700" />

				{/* Search trigger */}
				<button
					onClick={() => {
						window.dispatchEvent(new CustomEvent("open-search-palette"));
					}}
					className="flex h-9 cursor-pointer items-center gap-2 rounded-full px-3 text-sm text-zinc-400 transition-colors hover:text-white"
					title="Search (⌘P)"
				>
					<svg
						className="h-4 w-4"
						fill="none"
						stroke="currentColor"
						strokeWidth={1.5}
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
						/>
					</svg>
					<kbd className="hidden rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 sm:inline">
						⌘P
					</kbd>
				</button>

				{/* External Trakt link - only shown on entity pages */}
				{traktUrl && (
					<>
						<div className="h-5 w-px bg-zinc-700" />
						<a
							href={traktUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="flex h-9 cursor-pointer items-center rounded-full px-3 text-sm text-zinc-400 transition-colors hover:text-[#ed1c24]"
							title="View on Trakt"
						>
							<svg
								className="h-4 w-4"
								fill="none"
								stroke="currentColor"
								strokeWidth={1.5}
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
								/>
							</svg>
						</a>
					</>
				)}

				{/* Divider */}
				<div className="h-5 w-px bg-zinc-700" />

				{/* Auth */}
				{session?.user ? (
					<button
						onClick={async () => {
							await authClient.signOut();
							router.push("/auth/login");
						}}
						className="flex h-9 cursor-pointer items-center rounded-full px-3 text-sm text-zinc-400 transition-colors hover:text-white"
						title="Sign out"
					>
						<svg
							className="h-4 w-4"
							fill="none"
							stroke="currentColor"
							strokeWidth={1.5}
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
							/>
						</svg>
					</button>
				) : (
					<Link
						href="/auth/login"
						className="flex h-9 items-center rounded-full px-4 text-sm text-zinc-400 transition-colors hover:text-white"
					>
						Sign in
					</Link>
				)}
			</nav>
		</div>
	);
}
