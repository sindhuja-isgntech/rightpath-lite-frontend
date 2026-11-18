import { useEffect } from 'react';

const APP_NAME = 'RightPath';

/** Sets the browser tab title for the current page, e.g. "Dashboard – RightPath". */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} – ${APP_NAME}`;
    return () => {
      document.title = APP_NAME;
    };
  }, [title]);
}
