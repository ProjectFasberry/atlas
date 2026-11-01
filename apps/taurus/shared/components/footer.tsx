import { Link } from '@/shared/components/link';
import { getStaticObject } from '@/shared/lib/helpers';
import { For } from 'solid-js';
import { translate } from '../locales/helpers';

const createFooterLinks = () => ([
  { name: translate["footer.links.privacy"](), href: 'privacy' },
  { name: translate["footer.links.terms"](), href: 'terms' },
  { name: translate["footer.links.contacts"](), href: 'contacts' },
  { name: translate["footer.links.credits"](), href: 'credits' },
]);

const bedrockImage = getStaticObject("minecraft", "static/bedrock.webp")

export const Footer = () => {
  return (
    <footer
      class={`sticky flex-col flex justify-center items-center gap-6 pb-6 pt-12`}
      style={{ "background-size": '160px', "background-image": `url(${bedrockImage})` }}
    >
      <div class="flex flex-col justify-center items-center lg:flex-row responsive gap-2 mx-auto">
        <For each={createFooterLinks()}>
          {(item, idx) => (
            <>
              <Link href={`/info/${item.href}`}>
                <p>{item.name}</p>
              </Link>
              {idx() < createFooterLinks.length - 1 &&
                <span class="text-neutral-400 hidden lg:block mx-2">&</span>
              }
            </>
          )}
        </For>
      </div>
      <div class="flex flex-col items-center justify-center gap-2 responsive mx-auto">
        <p class="text-center">
          {translate["footer.copyright"]()}
        </p>
      </div>
    </footer>
  );
};
