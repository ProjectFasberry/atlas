import { env } from "@/shared/env";
import { getStaticObject } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers";

const image = getStaticObject("backgrounds", "donate_background.png")

const landing = env.VITE_LANDING_ENDPOINT

/** Organization and WebSite nodes are stable for the whole domain. */
const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Fasberry",
  url: landing,
  logo: image,
}

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Fasberry",
  url: landing,
  inLanguage: "ru",
}

export default function HeadDefault() {
  return (
    <>
      <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="shortcut icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <meta name="apple-mobile-web-app-title" content="Fasberry" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="author" content="Fasberry Team" />
      <meta name="format-detection" content="email=yes, address=yes, telephone=yes" />
      <meta name="description" content={translate["pages.global.description"]()} />
      <meta property="og:title" content="Fasberry" />
      <meta property="og:description" content={translate["pages.global.description-global"]()} />
      <meta property="og:locale" content="ru_RU" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={translate["pages.global.site_name"]()} />
      <meta property="og:image" content={image} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:alt" content="Fasberry — майнкрафт-проект" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:title" content="Fasberry" />
      <meta name="twitter:description" content={translate["pages.global.description-global"]()} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content="Fasberry — майнкрафт-проект" />
      <meta property="twitter:image:type" content="image/png" />
      <meta property="twitter:image:width" content="1200" />
      <meta property="twitter:image:height" content="630" />
      <script defer src="https://umami.fasberry.fun/k7.js" data-website-id="e94a6edf-fb13-4699-9fb3-48eb2efa2e02" />
      {__STAGE__ === "prod" ? (
        <meta name="robots" content="index, follow" />
      ) : (
        <meta name="robots" content="noindex, nofollow" />
      )}
      <meta name="googlebot" content="index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1" />
      <script type="application/ld+json" innerHTML={JSON.stringify(organizationLd)} />
      <script type="application/ld+json" innerHTML={JSON.stringify(websiteLd)} />
      <link rel="preconnect" href={env.PUBLIC_ENV__API_URL} crossOrigin="" />
      <link rel="preconnect" href={env.VITE_VOLUME_URL} crossOrigin="" />
      <link
        rel="preload"
        as="font"
        type="font/ttf"
        href="/fonts/minecraft.ttf"
        crossOrigin=""
      />
    </>
  );
}
