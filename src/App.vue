<template class>

    <!-- <nav>
    <router-link to="/">Home</router-link> |
    <router-link to="/about">About</router-link>
  </nav> -->
    <div v-if="!_is_loaded" class="loader_cont">
        <LoaderComponent :size="30" />
    </div>
    <div v-else>
        <ConnectComponent />
    </div>
    <!-- <div style="width: 100%;height: 100%;overflow: scroll;">
    <router-view/>
  </div> -->

</template>
<script setup>
    import ConnectComponent from './components/ConnectComponent.vue';
    import LoaderComponent from './components/LoaderComponent.vue';
    import {
        storage
    } from './util/storage.js';
    import {
        ref,
        reactive,
        onMounted,
        computed,
        watch
    } from 'vue';

    import { useUserStore} from '@/stores/user';
    const isLoggedIn = computed(()=>{
        return useUserStore().isAuth
    })

    watch(isLoggedIn.value, (_loginStatus)=>{
        if(_loginStatus) injectFloatingButton();
    })



    let _is_loaded = ref(false);
    // setTimeout(() => {
        
    // }, 2000);

    const isAuth = async () => {
        var _isauth =  storage.get('isAuthenticated');
        return _isauth;
    }

    const is_auth = ref(null);

    const injectFloatingButton = async () => {

      chrome.runtime.sendMessage({
            action: 'loadFloatingBtn'
        })
    };

    onMounted(async () => {
        _is_loaded.value = true;

        // await storage.set('isAuthenticated', true);
        // is_auth.value = await isAuth();
        // console.log('---mounted', is_auth.value);

        // injectFloatingButton();
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

    .loader_cont {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
    }
</style>
