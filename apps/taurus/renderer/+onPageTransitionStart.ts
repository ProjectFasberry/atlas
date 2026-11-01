import { BProgress } from '@bprogress/core';

export const onPageTransitionStart = async () => {
  document.querySelector("body")?.classList.add("page-is-transitioning");

  BProgress.start()
};
