import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { createTraktClient, type TraktClient } from "./trakt";

/**
 * Resolve the Trakt access token once per request, eagerly, before any
 * streaming begins. Wrapped in React.cache so every Server Component that
 * calls this shares the same promise within a single request — headers() is
 * only called once, and it's called synchronously at the top of the first
 * component that needs it, not lazily inside the stream.
 *
 * This works around a vinext bug where clearRequestContext() (which sets
 * headersContext to null) is called immediately after the RSC/SSR streams
 * are constructed, before the streams are actually consumed. On warm
 * subsequent requests the stream is consumed after cleanup, causing
 * headers() to throw "can only be called from a Server Component".
 */
const getAccessToken = cache(async (): Promise<string | null> => {
	const h = await headers();

	const session = await auth.api.getSession({ headers: h });
	if (!session) return null;

	const tokenRes = await auth.api.getAccessToken({
		headers: h,
		body: { providerId: "trakt" },
	});

	return tokenRes?.accessToken ?? null;
});

export async function getAuthenticatedTraktClient(): Promise<TraktClient> {
	const accessToken = await getAccessToken();

	if (!accessToken) {
		throw new Error("Not authenticated");
	}

	return createTraktClient(accessToken);
}

export async function getOptionalTraktClient(): Promise<TraktClient> {
	try {
		return await getAuthenticatedTraktClient();
	} catch {
		return createTraktClient();
	}
}
