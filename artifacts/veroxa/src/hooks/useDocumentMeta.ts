import { useEffect } from "react";

interface DocumentMeta {
  /** Document title for the page (set on the browser tab). */
  title: string;
  /** Optional meta description for search/link previews. */
  description?: string;
}

/**
 * Lightweight per-page document metadata hook.
 *
 * Sets `document.title` and the `<meta name="description">` content while the
 * page is mounted, restoring the previous values on unmount. No external SEO
 * dependency. Intended for public-facing pages only.
 */
export function useDocumentMeta({ title, description }: DocumentMeta): void {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    let cleanupDescription: (() => void) | undefined;

    if (description !== undefined) {
      const existing = document.head.querySelector<HTMLMetaElement>(
        'meta[name="description"]',
      );

      if (existing) {
        const previousContent = existing.getAttribute("content");
        existing.setAttribute("content", description);
        cleanupDescription = () => {
          if (previousContent === null) existing.removeAttribute("content");
          else existing.setAttribute("content", previousContent);
        };
      } else {
        const created = document.createElement("meta");
        created.setAttribute("name", "description");
        created.setAttribute("content", description);
        document.head.appendChild(created);
        cleanupDescription = () => created.remove();
      }
    }

    return () => {
      document.title = previousTitle;
      cleanupDescription?.();
    };
  }, [title, description]);
}
