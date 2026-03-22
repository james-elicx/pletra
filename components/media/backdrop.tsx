import Image from "next/image";

export function Backdrop({ src, alt }: { src: string | null; alt: string }) {
	if (!src) return null;

	return (
		<div className="fixed inset-0 -z-10">
			<Image src={src} alt={alt} fill className="object-cover" priority sizes="100vw" />
			<div className="absolute inset-0 backdrop-blur-sm" />
			<div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/75 to-background" />
		</div>
	);
}
