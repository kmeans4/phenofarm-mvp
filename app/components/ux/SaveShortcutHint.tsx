'use client';
import { useSyncExternalStore } from 'react';
const subscribe = () => () => {};
const readKeys = () =>
  /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘S' : 'Ctrl+S';
const serverKeys = () => 'Ctrl+S';
export function SaveShortcutHint() {
  const keys = useSyncExternalStore(subscribe, readKeys, serverKeys);
  return (
    <span className="hidden self-center text-sm text-pf-muted sm:inline">
      {keys} to save
    </span>
  );
}
