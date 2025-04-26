<template class>

  <!-- <nav>
    <router-link to="/">Home</router-link> |
    <router-link to="/about">About</router-link>
  </nav> -->
  <div v-if="!_is_loaded" class="loader_cont">
    <LoaderComponent :size="30"/>
  </div>
  <div v-else>
    <ConnectComponent/>
  </div>
  <!-- <div style="width: 100%;height: 100%;overflow: scroll;">
    <router-view/>
  </div> -->
  
</template>
<script setup>
import ConnectComponent from './components/ConnectComponent.vue';
import LoaderComponent from './components/LoaderComponent.vue';
import { storage } from './util/storage.js';
import {ref, reactive, onMounted} from 'vue';

let _is_loaded = ref(false);
setTimeout(() => {
  _is_loaded.value = true;
}, 5000);

const isAuth = async () =>{
  var _isauth = await storage.get('isAuthenticated');
  return _isauth;
}

const is_auth = ref(null);

const injectFloatingButton = async () => {
  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ 
      active: true, 
      currentWindow: true 
    });
    if (!tab?.id || !tab.url) {
      console.log('No active tab found or tab not ready');
      return;
    }

    
    if (tab.url.startsWith('chrome://') || 
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('about:')) {
      console.log('Skipping injection on special page:', tab.url);
      return;
    }
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        return {
          isInjectable: true,
          alreadyInjected: !!document.getElementById('otp-autofiller-extension-floating-btn')
        };
      }
    });

    const [result] = injectionResults;
    if (!result?.result?.isInjectable) {
      console.log('Tab is not injectable');
      return;
    }

    if (result.result.alreadyInjected) {
      console.log('Floating button already exists');
      return;
    }

    // Perform the actual injection
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['dist/js/floatingBtn.js']
    });

    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['dist/css/app.css']
    });

    console.log('Floating button injected successfully');
  } catch (error) {
    console.error('Injection failed:', error);
  }
};

onMounted(async () => {
  await storage.set('isAuthenticated', true);
  is_auth.value = await isAuth();
  console.log('---mounted', is_auth.value);

  injectFloatingButton();
})

</script>

<style lang="scss">
#app {
  background-color: var(--background-color);
  color: var(--text-color);
  width: 300px;
  height: 500px;
  box-sizing: border-box;
  overflow: hidden;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  border-radius: 20px;
}

nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
.loader_cont{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
}
</style>
