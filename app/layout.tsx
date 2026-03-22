import type { Metadata } from "next";
import { TASA_Orbiter, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { FloatingNav } from "@/components/nav/floating-nav";
import { SearchPalette } from "@/components/search/search-palette";
import "./globals.css";

const tasaOrbiter = TASA_Orbiter({
	variable: "--font-tasa-orbiter",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Trakt Dashboard",
	description: "Track your movies and shows",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${tasaOrbiter.variable} ${geistMono.variable} h-full antialiased dark`}
		>
			<body className="flex min-h-full flex-col bg-background text-foreground">
				<Providers>
					<main className="flex-1 pb-20">{children}</main>
					<FloatingNav />
					<SearchPalette />
				</Providers>
			</body>
		</html>
	);
}
