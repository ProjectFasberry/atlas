import type { ElementType, ReactNode } from "react";
import { cn } from "./cn";

export type SiteFooterLink = {
	label: string;
	href: string;
};

export type SiteFooterColumn = {
	title: string;
	links: SiteFooterLink[];
};

export type SiteFooterSocial = {
	label: string;
	href: string;
	icon: "telegram" | "discord";
};

type SiteFooterProps = {
	logo: ReactNode;
	columns: SiteFooterColumn[];
	warning: string;
	socials?: SiteFooterSocial[];
	/** app-specific outer spacing, for example the mobile dock inset in minotaur */
	className?: string;
	/** client-side link, the wiki uses plain anchors */
	linkComponent?: ElementType;
};

const SOCIAL_PATHS = {
	telegram:
		"M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.35-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z",
	discord:
		"M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z",
} as const;

function SocialIcon({ icon }: { icon: SiteFooterSocial["icon"] }) {
	return (
		// biome-ignore lint/a11y/noSvgWithoutTitle: the surrounding link carries the label
		<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-[18px]">
			<path d={SOCIAL_PATHS[icon]} />
		</svg>
	);
}

/**
 * Footer shared by the Fasberry apps: the same structure, columns and rhythm
 * everywhere, each app passes its own logo and the links it can reach. A dark
 * green band, so it looks the same on a light and on a dark page.
 */
export function SiteFooter({ logo, columns, warning, socials, className, linkComponent }: SiteFooterProps) {
	const Link = linkComponent ?? "a";

	return (
		<footer
			className={cn(
				`mt-auto flex h-full min-h-0 w-full items-center justify-center border-t border-green-700/30
        bg-gradient-to-br from-green-900 via-green-950 to-green-950 p-3 text-neutral-100 lg:min-h-40 lg:p-4`,
				className,
			)}
		>
			<div className="flex h-full w-full max-w-[clamp(420px,80vw,1200px)] flex-col items-center justify-center gap-4 px-2 sm:px-0">
				<div className="flex h-full w-full flex-col justify-between gap-4 lg:flex-row lg:items-start">
					<div className="flex h-full w-full flex-col items-start gap-4 lg:w-1/3">
						{logo}
						{socials && socials.length > 0 ? (
							<div className="flex items-center gap-2">
								{socials.map((social) => (
									<a
										key={`${social.icon}-${social.href}`}
										href={social.href}
										target="_blank"
										rel="noopener noreferrer"
										aria-label={social.label}
										className="flex items-center justify-center rounded-md bg-neutral-600/40 p-2 transition-colors duration-150 hover:bg-neutral-600/60"
									>
										<SocialIcon icon={social.icon} />
									</a>
								))}
							</div>
						) : null}
					</div>

					<div className="grid w-full auto-rows-auto grid-cols-1 gap-4 lg:w-2/3 lg:grid-cols-3 lg:grid-rows-none">
						{columns.map((column) => (
							<div key={column.title} className="flex min-w-0 flex-col gap-1 *:w-fit">
								<p className="truncate font-semibold">{column.title}</p>
								<div className="flex min-w-0 flex-col gap-1 *:truncate">
									{column.links.map((link) => (
										<Link
											key={`${link.href}-${link.label}`}
											href={link.href}
											className="text-neutral-300 transition-colors hover:text-white"
										>
											{link.label}
										</Link>
									))}
								</div>
							</div>
						))}
					</div>
				</div>

				<p className="text-wrap text-sm text-neutral-400">{warning}</p>
			</div>
		</footer>
	);
}
