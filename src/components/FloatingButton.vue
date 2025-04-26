<template>
    <div class="floating-btn" @click="toggleMenu">
        <span>🔑</span>
        <div v-if="showMenu" class="menu">
            <button @click="action1">Action 1</button>
            <button @click="action2">Action 2</button>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
    const showMenu = ref(false);

    const toggleMenu =()=>{
        showMenu.value= !showMenu.value;
    }

    const action1=()=> {
                chrome.runtime.sendMessage({
                    action: 'performAction1'
                })
    }

    const action2 = ()=> {
        chrome.runtime.sendMessage({
            action: 'performAction2'
        })
    }
    console.log('---injected---->');
</script>

<style>
    .floating-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: #4CAF50;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }

    .menu {
        position: absolute;
        bottom: 60px;
        right: 0;
        background: white;
        border-radius: 8px;
        padding: 10px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .menu button {
        padding: 5px 10px;
        background: #f0f0f0;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .menu button:hover {
        background: #e0e0e0;
    }
</style>
