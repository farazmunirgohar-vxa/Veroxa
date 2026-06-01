import { useEffect } from "react";

interface DocumentMeta {
  /** Document title for the page (set on the browser tab). */
  title: string;
  /** Optional meta description for search/link previews. */
  description?: string;
  /** Optional social card title. Defaults to title. */
  socialTitle?: string;
  /** Optional social card description. Defaults to description. */
  socialDescription?: string;
}

function upsertMeta(selector: string, attributes: Record<string, string>) {
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  const element = existing ?? document.createElement("meta");
  const previous = new Map<string, string | null>();

  for (const [name, value] of Object.entries(attributes)) {
    previous.set(name, element.getAttribute(name));
    element.setAttribute(name, value);
  }

  if (!existing) document.head.appendChild(element);

  return () => {
    if (!existing) {
      element.remove();
      return;
    }
    for (const [name, value] of previous.entries()) {
      if (value === null) element.removeAttribute(name);
      else element.setAttribute(name, value);
    }
  };
}

/**
 * Lightweight per-page document metadata hook.
 *
 * Sets `document.title`, description, and text-only Open Graph/Twitter preview
 * metadata while the page is mounted, restoring previous values on unmount. No
 * external SEO dependency and no generated image requirement.
 */
export function useDocumentMeta({
  title,
  description,
  socialTitle,
  socialDescription,
}: DocumentMeta): void {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const cleanups: Array<() => void> = [];
    const previewTitle = socialTitle ?? title;
    const previewDescription = socialDescription ?? description;

    cleanups.push(
      upsertMeta('meta[property="og:title"]', {
        property: "og:title",
        content: previewTitle,
      }),
      upsertMeta('meta[property="og:type"]', {
        property: "og:type",
        content: "website",
      }),
      upsertMeta('meta[name="twitter:card"]', {
        name: "twitter:card",
        content: "summary",
      }),
      upsertMeta('meta[name="twitter:title"]', {
        name: "twitter:title",
        content: previewTitle,
      }),
    );

    if (description !== undefined) {
      cleanups.push(
        upsertMeta('meta[name="description"]', {
          name: "description",
          content: description,
        }),
      );
    }

    if (previewDescription !== undefined) {
      cleanups.push(
        upsertMeta('meta[property="og:description"]', {
          property: "og:description",
          content: previewDescription,
        }),
        upsertMeta('meta[name="twitter:description"]', {
          name: "twitter:description",
          content: previewDescription,
        }),
      );
    }

    return () => {
      document.title = previousTitle;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [title, description, socialTitle, socialDescription]);
}
