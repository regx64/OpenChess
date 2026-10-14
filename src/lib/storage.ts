"use client";

import { useSyncExternalStore } from "react";

/**
 * 브라우저 localStorage에 저장되는 작은 상태 저장소.
 * DB·로그인이 없으므로 설정, 학습 진도, 레퍼토리 등은 모두 이 저장소에 보관합니다.
 * 서버 렌더링 중에는 기본값을 쓰고, 다른 탭에서 바뀌면 함께 갱신됩니다.
 */
export interface PersistentStore<T> {
  get(): T;
  set(next: T | ((previous: T) => T)): void;
  subscribe(listener: () => void): () => void;
  /** React에서 현재 값을 구독 */
  use(): T;
  readonly key: string;
  readonly defaults: T;
}

const PREFIX = "openchess:";

export function createPersistentStore<T>(
  name: string,
  defaults: T,
  /** 저장된 값을 기본값과 합치는 방법 (객체면 기본은 얕은 병합) */
  merge: (stored: unknown, defaults: T) => T = (stored, defaults) =>
    typeof defaults === "object" &&
    defaults !== null &&
    !Array.isArray(defaults) &&
    typeof stored === "object" &&
    stored !== null
      ? ({ ...defaults, ...(stored as object) } as T)
      : ((stored as T) ?? defaults),
): PersistentStore<T> {
  const key = PREFIX + name;
  const listeners = new Set<() => void>();
  let value: T | undefined;

  const read = (): T => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? defaults : merge(JSON.parse(raw), defaults);
    } catch {
      return defaults;
    }
  };

  const notify = () => {
    for (const listener of listeners) listener();
  };

  const store: PersistentStore<T> = {
    key,
    defaults,
    get() {
      if (typeof window === "undefined") return defaults;
      value ??= read();
      return value;
    },
    set(next) {
      const resolved =
        typeof next === "function"
          ? (next as (previous: T) => T)(store.get())
          : next;
      value = resolved;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // 저장 공간이 없거나 막혀 있어도 이번 세션 동안은 메모리 값으로 동작
      }
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) {
          value = read();
          notify();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
    use() {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useSyncExternalStore(store.subscribe, store.get, () => defaults);
    },
  };
  return store;
}

/** 이 앱이 localStorage에 저장한 모든 항목 (백업용) */
export function exportAllStores(): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key?.startsWith(PREFIX)) continue;
    try {
      data[key.slice(PREFIX.length)] = JSON.parse(
        window.localStorage.getItem(key)!,
      );
    } catch {
      // 깨진 항목은 건너뜀
    }
  }
  return data;
}
