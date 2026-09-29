'use client';
import { useState, useSyncExternalStore } from 'react';
const mediaQuery = '(min-width:1024px)';
function subscribe(onChange: () => void) {
  const media = window.matchMedia(mediaQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
const readDesktop = () => window.matchMedia(mediaQuery).matches;
const serverDesktop = () => false;
export function LegalContents({
  sections,
}: {
  sections: Array<{ id: string; title: string }>;
}) {
  const desktop = useSyncExternalStore(subscribe, readDesktop, serverDesktop);
  const [choice, setChoice] = useState<{
    desktop: boolean;
    open: boolean;
  } | null>(null);
  const open = choice?.desktop === desktop ? choice.open : desktop;
  return (
    <details
      open={open}
      onToggle={(event) => {
        if (event.currentTarget.open !== open) {
          setChoice({ desktop, open: event.currentTarget.open });
        }
      }}
      className="rounded-xl border border-pf-line bg-pf-surface p-4"
    >
      <summary className="min-h-11 cursor-pointer content-center text-sm font-semibold">
        Contents
      </summary>
      <ol className="mt-2 space-y-1">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="inline-flex min-h-11 items-center text-sm text-pf-secondary hover:text-pf-accent"
            >
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}
