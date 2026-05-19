import { useEffect } from 'react';
import { X5_FAVICON_HREF } from './standBranding';

/** Единая фавиконка X5 (short) и заголовок вкладки. */
export function useDocumentBranding(pageTitle: string) {
  useEffect(() => {
    document.title = pageTitle;

    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/svg+xml';
    link.href = X5_FAVICON_HREF;
  }, [pageTitle]);
}
