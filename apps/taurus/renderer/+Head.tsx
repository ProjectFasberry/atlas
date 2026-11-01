import { env } from "@/shared/env";
import { getStaticObject } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers";

const image = getStaticObject("backgrounds", "donate_background.png")

export default function HeadDefault() {
  return (
    <>
      <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="shortcut icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <meta name="apple-mobile-web-app-title" content="Fasberry" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="keywords" content="fasberry, minecraft, фасберри, фесберри, фесберри проект, майнкрафт сервер,
        майнкрафт, майнкрафт играть, minecraft play, сервера майнкрафт бесплатно, список серверов майнкрафта,
        полу-ванильные сервера майнкрафта, полуванила майнкрафт, rp сервер майнкрафт, rpg сервер майнкрафт,
        rp rpg сервер майнкрафт, город в майнкрафте сервер, minecraft server, выживание, survival minecraft,
        survival, smp, fasberry project, minecraft fasberry, minecraft server play"/>
      <meta name="author" content="Fasberry Team" />
      <meta name="format-detection" content="email=yes, address=yes, telephone=yes" />
      <meta name="description" content={`${translate["pages.global.description"]({ ip: `play.${env.VITE_MAIN_DOMAIN}` })}`} />
      <meta property="og:title" content="Fasberry" />
      <meta property="og:description" content={translate["pages.global.description-global"]()} />
      <meta property="og:locale" content="ru_RU" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={translate["pages.global.site_name"]()} />
      <meta property="og:image" content={image} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:title" content="Fasberry" />
      <meta name="twitter:description" content={translate["pages.global.description-global"]()} />
      <meta name="twitter:image" content={image} />
      <meta property="twitter:image:type" content="image/jpeg" />
      <meta property="twitter:image:width" content="1200" />
      <meta property="twitter:image:height" content="630" />
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow, noimageindex, max-video-preview:-1, max-image-preview:large, max-snippet:-1" />
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
