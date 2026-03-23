"use client";

import Image from "next/image";
import { useSettings } from "@/lib/settings";

export function ProfileBackdropClient({ src }: { src: string }) {
	const { settings } = useSettings();

	if (!settings.showBackdrops) return null;

	return (
		<div className="fixed inset-0 -z-10 h-screen w-screen">
			<Image
				src={src}
				alt="Profile backdrop"
				fill
				className="object-cover"
				priority
				sizes="100vw"
			/>
			<div className="absolute inset-0 backdrop-blur-[6px]" />
			<div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
		</div>
	);
}
