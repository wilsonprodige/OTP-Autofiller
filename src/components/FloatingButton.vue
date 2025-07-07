<template>

    <div class="btn_overlay_wrapper"
        :style="{ right: `${_floating_el_position.right}px`, bottom: `${_floating_el_position.bottom}px` }" ref="floatingElement" >
        <div class="action_btn_container d-flex justify-content-center align-items-center" v-if="isAuthenticated">
            <div class="logo-btn" @click="()=>{toggleMenu()}">
                <span v-if="!showMenu">O</span>
                <div v-else>
                  
                        <svg class="mx-auto" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" 
                            fill="currentColor" stroke="currentColor" stroke-width="0.5" stroke-linecap="round" 
                            stroke-linejoin="round">
                            <path d="M18 6L6 18"></path>
                            <path d="M6 6l12 12"></path>
                        </svg>
                   
                </div>
                
            </div>
            <svg class="move_icon" height="18" id="floating_move_icon_trigger" viewBox="0 0 8 18" width="8"
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
                <FloatingMenuComponent :otpList="otpHistoryList" @clear="handleHistoryClear" @fill="handleOtpFill"/>
            </div>
        </transition>

        <!--slide notifi for incoming otp-->
       

    </div>

    <transition name="slide_x">
            <div v-if="showOtpNotif" class="otp_autofiller_otp_notication_overlay">
                <OtpNotification :otp_object="_active_object" @close="toggleOtpNotif(false)" @fill="handleOtpFill"/>
            </div>
    </transition>


</template>

<script setup>
    import {
        useFloatingElementStore
    } from '@/stores/floatingElement'
    const useFloatingElement = useFloatingElementStore();
    import { storage } from '@/util/storage';
    import FloatingMenuComponent from './FloatingMenuComponent.vue';
    import OtpNotification from './OtpNotification.vue';
    import {
        ref,
        reactive,onMounted,onUnmounted, computed
    } from 'vue';
    import {siteSpecificHandlers} from '@/custom_scripts/siteSpecificHandlers.js'
    const showMenu = ref(false);

   import { useChromeStorage } from '@/composables/useChromeStorage.js';

   const { value: chromeStorageState } = useChromeStorage();
   const isAuthenticated = computed(() => chromeStorageState.value?.isAuthenticated);
   const otpHistoryList = computed(()=> chromeStorageState.value?.otpHistory ?? []);
    

    const toggleMenu = () => {
        showMenu.value = !showMenu.value;
    }
    let showOtpNotif= ref(false);
    const toggleOtpNotif = (_state=null) =>{
        if(_state===null){
         showOtpNotif.value= !showOtpNotif.value
         return
        }
        showOtpNotif.value = _state;
        console.log(showOtpNotif.value);

    }

    const handleHistoryClear =async () =>{
        await storage.set('otpHistory',[]);
        return
    }

    const handleOtpFill = async (_code)=>{
        if (!_code || typeof _code !== 'string') {
            console.error('Invalid OTP code provided');
            return;
        }

        try {
          
            const inputs = document.querySelectorAll(`
                input[type="number"],
                input[type="text"][inputmode="numeric"],
                input[type="text"][autocomplete="one-time-code"],
                input[type="tel"]
            `);

            
            const otpInputs = Array.from(inputs).filter(input => 
                input.offsetParent !== null &&  
                !input.disabled &&            
                !input.readOnly                
            );
            

            if (otpInputs.length === 0) {
                console.log('No suitable OTP input fields found');
                return;
            }

            
            

            if((window.location.href?.split('/')?.[2]==='app.gohighlevel.com') || ((document?.querySelector('section.hl_login')) && (document?.querySelector('div.hl_login--header')) && document?.querySelector('section.hl_login')?.contains(document?.querySelector('div.hl_login--header')))){
                console.log('---ghl otp board--->');
                siteSpecificHandlers['app.gohighlevel.com'](otpInputs, _code);
                return;
                
            }

            const currentDomain = window.location.hostname.replace('www.', '');
            const domainHandler = Object.keys(siteSpecificHandlers).find(domain => 
                currentDomain.includes(domain)
            );

            if (domainHandler) {
                siteSpecificHandlers[domainHandler](otpInputs, _code);
                return
            }

            if (otpInputs.length > 1 && otpInputs.length <= 8) {
            
                       
                        console.log('Filling multi-input OTP field');
                        for (let i = 0; i < Math.min(_code.length, otpInputs.length); i++) {
                        const input = otpInputs[i];
                        if(!input) break;
                        input.value = _code[i];

                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        input.dispatchEvent(new Event('change', { bubbles: true }));

                        // if (i < otpInputs.length - 1) {
                        //     setTimeout(() => otpInputs[i+1].focus(), 50);
                        // }
                        //case ghl login
                        
                        }
                    
                    
                //}
            }

            
            const primaryInput = otpInputs[0];
            console.log('Filling single OTP input field');
            primaryInput.value = _code;

            primaryInput.dispatchEvent(new Event('input', { bubbles: true }));
            primaryInput.dispatchEvent(new Event('change', { bubbles: true }));
            //primaryInput.dispatchEvent(new Event('blur', { bubbles: true }));
            
        } catch (error) {
            console.error('Error filling OTP:', error);
        }
    }


    function simulatePasteToOTPFields(_input_field,otpCode) {
        _input_field.focus();

        const pasteEvent = new ClipboardEvent('paste', {
            bubbles: true,
            cancelable: true,
            clipboardData: new DataTransfer()
        });
        pasteEvent.clipboardData.setData('text/plain', otpCode);
        const wasPasteSuccessful = _input_field.dispatchEvent(pasteEvent);
        
        if (!wasPasteSuccessful) {
            console.log('Paste event was prevented - falling back to manual input');
            return;
        }
    }

    function executeInPageContext(func) {
        const script = document.createElement('script');
        script.textContent = `(${func.toString()})();`;
        document.documentElement.appendChild(script);
        script.remove();
    }

    function triggerVueEvent() {
        const vueInstance = document.getElementById('app')?.__vue__;
        
        if (!vueInstance) {
            console.error('Vue instance not found in page context');
            return;
        }

        try {
            vueInstance?.$children?.[9]?.$children?.[1]?.$children?.[2]?.$listeners['on-complete']();
            console.log('Vue event triggered successfully');
        } catch (error) {
            console.error('Error triggering Vue event:', error);
        }
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
      startOTPMonitoring();

    

       
    });

    onUnmounted(() => {
      
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('touchmove', handleDrag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchend', stopDrag);
    });
    
    let _active_object= ref({  
    });

    function generateDarkColorForWhiteText() {
        const r = Math.floor(Math.random() * 150);
        const g = Math.floor(Math.random() * 150);
        const b = Math.floor(Math.random() * 150);
        const toHex = (c) => {
        const hex = c.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

    const handleNewOtp =async (_otpData) => {
        _active_object.value={
            source:_otpData?.email,
            code : _otpData?.otp,
            time:_otpData?.time,
            color:generateDarkColorForWhiteText(),
            showActions: false,
            selected: false
        }
       
        toggleOtpNotif(true);

        await storage.set('otpHistory',otpHistoryList.value ? [ _active_object.value,...(otpHistoryList.value ?? [])] : [_active_object.value] );
        return
       

    }

    //event listener for otps
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'NEW_OTP') {
        //console.log('---otp--active--tab');
        const otpData = message.data;
        console.log('New OTP received:', otpData);
        handleNewOtp(otpData);
        
        
        // const otpInputs = document.querySelectorAll('input[type="text"][autocomplete="one-time-code"], input[type="number"]');
        // if (otpInputs.length > 0 && otpData.otp.match(/^\d+$/)) {
        // otpInputs[0].value = otpData.otp;
        // otpInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        // }
    }
    else if(message.type == 'log'){
        console.log('-----log-->', message?.data)
    }
    });

    async function registerForPushNotifications() {
        try {
            // Send message to background to register for push
            const { success, subscription } = await chrome.runtime.sendMessage({
                action: 'registerPush'
            });
            console.log(success, subscription, 'response from register subscription--->');

            // if (success) {
            // // Send subscription to your server
            // await fetch('https://your-server.com/api/subscribe', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({
            //     subscription,
            //     currentUrl: window.location.href
            //     })
            // });
            
            // console.log('Successfully registered for push notifications');
            // return true;
            //}
        } catch (error) {
            console.error('Push registration failed:', error);
            return false;
        }
    }

    const startOTPMonitoring = () => {
        console.log('--floater-start');
        chrome.runtime.sendMessage({ action: 'START_OTP_MONITORING' });
    };

    const stopOTPMonitoring = () => {
        chrome.runtime.sendMessage({ action: 'STOP_OTP_MONITORING' });
    };
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
    .btn_overlay_wrapper .action_btn_container{
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .btn_overlay_wrapper .action_btn_container svg.move_icon {
        opacity: 0;
        margin-left: 7px;
        cursor: move;
    }

    .btn_overlay_wrapper .action_btn_container:hover svg.move_icon {
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

    .otp_autofiller_otp_notication_overlay{
        position: fixed;
        top: 40px;
        z-index: 9999;
        right: 30px;
        background: none;
        border-radius: 16px;
        padding: 6px;
        box-shadow: 4px 4px 20px rgba(0, 0, 0, 0.15);
        display: flex;
        min-width: 300px;
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
