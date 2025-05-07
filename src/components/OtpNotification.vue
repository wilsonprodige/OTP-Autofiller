<template>

    <div  class="otp-item">
        <div class="otp-avatar" :style="{ backgroundColor: otp_object.color ??  '' }">
            {{ otp_object?.source?.charAt(0) ?? 'N' }}
        </div>
        <div class="otp-details">
            <div class="otp-source">{{ otp_object?.source }}</div>
            <div class="otp-code">{{ otp_object?.code }}</div>
        </div>

        <div class="otp-actions" >
            <button class="action-button copy" @click="$emit('close')">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                close
            </button>
            <button class="action-button refresh" @click="$emit('fill')">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                </svg>
                fill
            </button>
        </div>
    </div>


</template>

<script setup>
    import {
        ref,
        onMounted,
        onUnmounted,
        computed
    } from 'vue';

    const props = defineProps({
        otp_object:{
            type:Object,
            default:{

            }, 
            required:true
        }
    });

    const emits = defineEmits(['close', 'fill']);

    

    onMounted(() => {
       setTimeout(()=>{
        emits('close');
       }, 10000)
    });

    onUnmounted(() => {
        
    });

    
</script>

<style scoped>
    .otp-widget {
        width: 340px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        position: relative;
    }

    .otp-widget::before {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 120px;
        height: 120px;
        background: #6ca6d9;
        border-radius: 0 0 0 100%;
        z-index: 0;
    }

    .otp-widget-header {
        padding: 10px 14px;
        display: flex;
        align-items: center;
        position: relative;
        z-index: 1;
    }

    .back-button {
        background: none;
        border: none;
        cursor: pointer;
        margin-right: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #555;
    }

    .otp-widget-header h2 {
        margin-left: 5px;
        font-size: 16px;
        font-weight: 600;
        color: #333;
    }

    .otp-list {
        min-height: 300px;
        padding: 0 8px 12px;
        max-height: 352px;
        overflow: scroll;
        scroll-behavior: smooth;
        margin-bottom: 10px;
    }

    .otp-search {
        padding: 0 8px 12px;
        position: relative;
    }

    .otp-search input {
        outline: none;
        width: 100%;
        height: 30px;
        border-radius: 10px;
        color: black !important;
        font-size: 13px;
        position: relative;
        z-index: 2;
        background: white;
        width: 150px;
        border: 1px solid #b8b7b7;
        padding: 0 20px 0 30px;
        box-shadow: 0px 1px 12px rgba(0, 0, 0, 0.15);
        transition: width 1s linear;
    }

    .otp-search input:focus {
        border-color: var(--primary);
        transition: 0.4s ease-in-out;
        width: 100%;
        box-shadow: 0px 1px 9px var(--primary);
    }

    .otp-item {
        width: 100%;
        display: flex;
        align-items: center;
        padding: 8px 12px;
        margin-bottom: 6px;
        border-radius: 10px;
        position: relative;
        transition: all 0.2s ease;
        position: relative;
        background: #ffffff;
    }

    .otp-item::before {
        content: "";
        width: 100%;
        position: absolute;
        height: 100%;
        border-radius: 10px;
        top: 0;
        right: 0;
        display: flex;
        background: transparent;
        box-shadow: 0px 3px 18px rgba(0, 0, 0, 0.15);
    }

    .otp-item:hover {
        background: #f8f8f8;
        cursor: pointer;
        transform: translateY(-2px);
    }

    /* .otp-item:hover::before{
        display: none;
    } */

    .otp-item.selected {
        background: var(--primary);
        color: white;
    }

    .otp-avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        overflow: hidden;
        margin-right: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
        font-weight: 600;
    }

    .otp-details {
        flex: 1;
    }

    .otp-source {
        font-size: 13px;
        font-weight: 500;
        margin-bottom: 4px;
    }

    .otp-code {
        font-size: 15px;
        font-weight: 600;
        letter-spacing: 0.4px;
    }

    .otp-time {
        text-align: right;
        margin-left: 10px;
    }

    .time-value {
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 4px;
    }

    .time-bar {
        width: 50px;
        height: 4px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 2px;
        overflow: hidden;
    }

    .selected .time-bar {
        background: rgba(255, 255, 255, 0.3);
    }

    .time-progress {
        height: 100%;
        background: var(--primary);
        border-radius: 2px;
        transition: width 1s linear;
    }

    .selected .time-progress {
        background: white;
    }

    .otp-actions {
        position: absolute;
        top: 50%;
        right: 15px;
        transform: translateY(-50%);
        display: flex;
        gap: 8px;
        z-index: 10;
    }

    .action-button {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 5px 8px;
        border-radius: 6px;
        border: none;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .action-button.copy {
        background: #f0f0f0;
        color: #333;
    }

    .action-button.refresh {
        background: var(--primary);
        color: white;
    }

    .action-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
    }

    .selected .action-button.copy {
        background: rgba(255, 255, 255, 0.2);
        color: white;
    }

    .icon {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* List item animation */
    .list-item-enter-active,
    .list-item-leave-active {
        transition: all 0.4s ease;
    }

    .list-enter-from,
    .list-leave-to {
        opacity: 0;
        transform: translateX(30px);
    }

    .list-leave-active {
        position: absolute;
    }

    .bi-search {
        top: 5px;
        position: absolute;
        left: 19px;
        z-index: 3;
        color: #b8b7b7;
        font-size: 14px;
    }
</style>
