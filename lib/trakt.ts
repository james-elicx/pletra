import { traktApi, Environment } from "@trakt/api";

export type TraktClient = ReturnType<typeof traktApi>;

export function createTraktClient(accessToken?: string) {
	return traktApi({
		environment: Environment.production,
		apiKey: process.env.TRAKT_CLIENT_ID!,
		fetch: (url, init) => {
			const headers = new Headers(init?.headers);
			if (accessToken) {
				headers.set("Authorization", `Bearer ${accessToken}`);
			}
			headers.set("user-agent", "trakr-client/1.0");
			return fetch(url, { ...init, headers });
		},
	});
}
