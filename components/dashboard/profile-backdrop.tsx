import { getAuthenticatedTraktClient } from "@/lib/trakt-server";
import Image from "next/image";

export async function ProfileBackdrop() {
	const client = await getAuthenticatedTraktClient();

	const res = await client.users.profile({
		params: { id: "me" },
		query: { extended: "vip" },
	});

	if (res.status !== 200) return null;

	type Profile = { vip_cover_image?: string | null };
	const profile = res.body as unknown as Profile;
	const coverImage = profile.vip_cover_image;

	if (!coverImage) return null;

	return (
		<div className="fixed inset-0 -z-10">
			<Image
				src={coverImage}
				alt="Profile backdrop"
				fill
				className="object-cover"
				priority
				sizes="100vw"
			/>
			<div className="absolute inset-0 backdrop-blur-[6px]" />
			<div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />
		</div>
	);
}
