'use client';

import { useEffect, useState } from 'react';

interface SettingsSection {
  id: string;
  label: string;
}

export function SettingsSectionNav({ sections }: { sections: SettingsSection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id || '');

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) setActiveId(visible.target.id);
      },
      { rootMargin: '-15% 0px -70% 0px' },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="Settings sections" className="rounded-lg border border-pf-line bg-pf-surface p-1 shadow-sm">
      <div className="flex gap-1 overflow-x-auto">
        {sections.map((section) => {
          const active = section.id === activeId;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={active ? 'location' : undefined}
              className={`flex min-h-10 shrink-0 items-center rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 ${
                active ? 'bg-pf-accent-bg text-pf-accent' : 'text-pf-muted hover:bg-pf-canvas hover:text-pf-text'
              }`}
            >
              {section.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
