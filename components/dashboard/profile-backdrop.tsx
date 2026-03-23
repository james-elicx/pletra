import Image from "next/image";
import { getAuthenticatedTraktClient } from "@/lib/trakt-server";
import { ProfileBackdropClient } from "./profile-backdrop-client";

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

	return <ProfileBackdropClient src={coverImage} />;
}
