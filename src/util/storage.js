import {ref , watchEffect} from 'vue';

const storageState = ref({});


chrome.storage.local.get(null, (items) => {
  storageState.value = items;
});


chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    for (const [key, { newValue }] of Object.entries(changes)) {
      storageState.value[key] = newValue;
    }
  }
});

export const storage = {

    getState() {
      return storageState;
    },
    get(key) {
      return storageState.value[key];
    },
    
    async get(key) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
          resolve(result[key]);
        });
      });
    },
  
   
    async set(key, value) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => {
          resolve();
        });
      });
    },

    async setMultiple(items) {
      return new Promise((resolve) => {
        chrome.storage.local.set(items, () => {
          resolve();
        });
      });
    },
  
   
    async remove(key) {
      return new Promise((resolve) => {
        chrome.storage.local.remove([key], () => {
          resolve();
        });
      });
    },
    async clear() {
      return new Promise((resolve) => {
        chrome.storage.local.clear(() => {
          resolve();
        });
      });
    }
  };