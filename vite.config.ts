import { defineConfig } from "vite-plus";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	plugins: [
		tailwindcss(),
		vinext(),
		cloudflare({
			viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
		}),
	],
	staged: {
		"*": "vp check --fix",
	},
	fmt: {
		printWidth: 100,
		useTabs: true,
		ignorePatterns: [],
	},
	lint: {
		options: {
			typeAware: true,
			typeCheck: true,
		},
	},
});
