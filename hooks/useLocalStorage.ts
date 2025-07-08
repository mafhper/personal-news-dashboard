
import { useState, useEffect } from 'react';

function getStorageValue<T,>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') {
        return defaultValue;
    }
    const saved = window.localStorage.getItem(key);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse from localStorage", e);
            return defaultValue;
        }
    }
    return defaultValue;
}

export function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    return getStorageValue(key, initialValue);
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Failed to set item in localStorage for key "${key}"`, e);
    }
  }, [key, value]);

  return [value, setValue];
}
