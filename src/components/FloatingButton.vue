<template>

    <div class="btn_overlay_wrapper"
        :style="{ right: `${_floating_el_position.right}px`, bottom: `${_floating_el_position.bottom}px` }" ref="floatingElement">
        <div class="action_btn_container d-flex justify-content-center align-items-center">
            <div class="logo-btn" @click="toggleMenu">
                <span v-if="!showMenu">O</span>
                <span v-else>X</span>
            </div>
            <svg height="18" id="floating_move_icon_trigger" viewBox="0 0 8 18" width="8"
                xmlns="http://www.w3.org/2000/svg"
                
                @mousedown="startDrag"
                @touchstart="startDrag"
                style="cursor: move; touch-action: none;"
                >
                <path
                    d="M6.5,18 C5.67157288,18 5,17.3284271 5,16.5 C5,15.6715729 5.67157288,15 6.5,15 C7.32842712,15 8,15.6715729 8,16.5 C8,17.3284271 7.32842712,18 6.5,18 Z M6.5,8 C5.67157288,8 5,7.32842712 5,6.5 C5,5.67157288 5.67157288,5 6.5,5 C7.32842712,5 8,5.67157288 8,6.5 C8,7.32842712 7.32842712,8 6.5,8 Z M6.5,23 C5.67157288,23 5,22.3284271 5,21.5 C5,20.6715729 5.67157288,20 6.5,20 C7.32842712,20 8,20.6715729 8,21.5 C8,22.3284271 7.32842712,23 6.5,23 Z M6.5,13 C5.67157288,13 5,12.3284271 5,11.5 C5,10.6715729 5.67157288,10 6.5,10 C7.32842712,10 8,10.6715729 8,11.5 C8,12.3284271 7.32842712,13 6.5,13 Z M11.5,18 C10.6715729,18 10,17.3284271 10,16.5 C10,15.6715729 10.6715729,15 11.5,15 C12.3284271,15 13,15.6715729 13,16.5 C13,17.3284271 12.3284271,18 11.5,18 Z M11.5,8 C10.6715729,8 10,7.32842712 10,6.5 C10,5.67157288 10.6715729,5 11.5,5 C12.3284271,5 13,5.67157288 13,6.5 C13,7.32842712 12.3284271,8 11.5,8 Z M11.5,23 C10.6715729,23 10,22.3284271 10,21.5 C10,20.6715729 10.6715729,20 11.5,20 C12.3284271,20 13,20.6715729 13,21.5 C13,22.3284271 12.3284271,23 11.5,23 Z M11.5,13 C10.6715729,13 10,12.3284271 10,11.5 C10,10.6715729 10.6715729,10 11.5,10 C12.3284271,10 13,10.6715729 13,11.5 C13,12.3284271 12.3284271,13 11.5,13 Z"
                    fill-rule="evenodd" transform="translate(-5 -5)"></path>
            </svg>
        </div>

        <transition name="slide">
            <div v-if="showMenu" class="floating_overlay_menu">
                <FloatingMenuComponent />
            </div>
        </transition>

        <!--slide notifi for incoming otp-->
        <transition name="slide_x">
            <div v-if="showMenu" class="otp_notication_overlay">
                <OtpNotification otp_object="_active_object"/>
            </div>
        </transition>

    </div>


</template>

<script setup>
    import {
        useFloatingElementStore
    } from '@/stores/floatingElement'
    const useFloatingElement = useFloatingElementStore();

    import FloatingMenuComponent from './FloatingMenuComponent.vue';
    import OtpNotification from './OtpNotification.vue';
    import {
        ref,
        reactive,onMounted,onUnmounted
    } from 'vue';
    const showMenu = ref(false);

    const toggleMenu = () => {
        showMenu.value = !showMenu.value;
    }

    const action1 = () => {
        chrome.runtime.sendMessage({
            action: 'performAction1'
        })
    }

    const action2 = () => {
        chrome.runtime.sendMessage({
            action: 'performAction2'
        })
    }

    //---dragging

    const floatingElement = ref(null);
    const _floating_el_position = ref({
      right: 20,
      bottom: 20
    });
    
   
    const isDragging = ref(false);
    const startPos = ref({ x: 0, y: 0 });
    const startElementPos = ref({ right: 0, bottom: 0 });

    const startDrag = (e) => {
      e.preventDefault();
      isDragging.value = true;
      startPos.value = {
        x: e.clientX || e.touches[0].clientX,
        y: e.clientY || e.touches[0].clientY
      };
      
      startElementPos.value = { ..._floating_el_position.value };
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('touchmove', handleDrag, { passive: false });
      document.addEventListener('mouseup', stopDrag);
      document.addEventListener('touchend', stopDrag);
    };

    const handleDrag = (e) => {
      if (!isDragging.value) return;
      e.preventDefault();
      
      const currentX = e.clientX || e.touches[0].clientX;
      const currentY = e.clientY || e.touches[0].clientY;
      
      const deltaX = currentX - startPos.value.x;
      const deltaY = currentY - startPos.value.y;
      
      // Calculate new position (invert deltaX since we're using right positioning)
      _floating_el_position.value = {
        right: Math.max(0, startElementPos.value.right - deltaX),
        bottom: Math.max(0, startElementPos.value.bottom - deltaY)
      };
    };

    const stopDrag = async () => {
      isDragging.value = false;
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('touchmove', handleDrag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchend', stopDrag);
      chrome.storage.local.set({ floatingBtnPosition: _floating_el_position.value });
    };

    onMounted(() => {
      chrome.storage.local.get('floatingBtnPosition').then(({ floatingBtnPosition }) => {
        if (floatingBtnPosition) {
            _floating_el_position.value = floatingBtnPosition;
        }
      });
    });

    onUnmounted(() => {
      
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('touchmove', handleDrag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchend', stopDrag);
    });
    
    let _active_object= ref({
        
            source: 'Microsoft',
            code: '472 183',
            timeLeft: 25,
            color: '#00A4EF',
            showActions: false,
            selected: false
        
    });
</script>

<style>
    /* logo btn trigger styles */
    .btn_overlay_wrapper {
        position: fixed;
        background: transparent;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        /* box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2); */

    }

    .btn_overlay_wrapper .action_btn_container svg {
        opacity: 0;
        margin-left: 7px;
        cursor: move;
    }

    .btn_overlay_wrapper .action_btn_container:hover svg {
        opacity: 1;
        transition: all 0.2s step-start;
    }

    .logo-btn {
        width: 30px;
        height: 30px;
        background-color: #007bff;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #fff;
        font-size: 18px;
        font-weight: 700;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.25);
        cursor: pointer;
    }



    .floating_overlay_menu {
        position: absolute;
        bottom: 60px;
        right: 50px;
        background: none;
        border-radius: 16px;
        padding: 6px;
        box-shadow: 4px 4px 20px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        gap: 5px;
        color: #333;
    }

    .otp_notication_overlay{
        position: absolute;
        top: 40px;
        right: 30px;
        background: none;
        border-radius: 16px;
        padding: 6px;
        box-shadow: 4px 4px 20px rgba(0, 0, 0, 0.15);
        display: flex;
        color: #333;
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


    /* Slide animation */
    .slide-enter-active,
    .slide-leave-active, .slide_x-enter-active,.slide_x-leave-active {
        transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .slide-enter-from {
        opacity: 0;
        transform: translateY(100px);
    }

    .slide-leave-to {
        opacity: 0;
        transform: translateY(100px);
    }

    .slide_x-enter-from {
        opacity: 0;
        transform: translateX(100px);
    }

    .slide_x-leave-to {
        opacity: 0;
        transform: translateX(100px);
    }
    /* slid x*/
    
</style>
