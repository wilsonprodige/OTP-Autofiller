import { ref, watchEffect } from 'vue';
import { storage } from '@/util/storage';

export function useChromeStorage(key) {
  const value = ref(null);
  const state = storage.getState();

  watchEffect(() => {
    value.value = key ? state.value[key] : state.value;
  });

  return {
    value,
    set: (newValue) => storage.set(key, newValue),
    remove: () => storage.remove(key)
  };
}