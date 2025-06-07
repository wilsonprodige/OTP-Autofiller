<template>

    <div class="otp-widget-container">
        <div class="otp-widget">
            <div class="otp-widget-header">
                <h2>OTP History</h2>
                <!--clear history btn-->
                <button class="action-button clear ml-auto" @click="clearHistory" v-if="computedOtpList.length">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" 
                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" 
                        stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    Clear
                </button>
            </div>
            <div class="otp-search">
                <i class="bi bi-search" ></i>
                <input type="text" v-model="search" placeholder="search..." :disabled="!computedOtpList.length">
            </div>

            <div class="otp-list" v-if="computedOtpList.length">
                <TransitionGroup name="list-item">
                    <div v-for="(otp, index) in computedOtpList" :key="index" class="otp-item"
                        :class="{ 'selected': otp.selected }" @mouseenter="otp.showActions = true"
                        @mouseleave="otp.showActions = false">

                        
                        <div class="otp-avatar" :style="{ backgroundColor: otp.color }">
                            {{ otp ?. source ?. charAt(0) }}
                        </div>
                        <div class="otp-details">
                            <div class="otp-source">{{ otp . source }}</div>
                            <div class="otp-code">{{ otp . code }}</div>
                        </div>
                        <div class="otp-time">
                            <div class="time-value">{{ moment(otp ?. time).format("MMMM D, YYYY h:mm A") ?? '' }}s</div>
                            <!-- <div class="time-bar">
                                <div class="time-progress" :style="{ width: (otp.timeLeft / 30) * 100 + '%' }"></div>
                            </div> -->
                        </div>

                        <div class="otp-actions" v-if="otp.showActions">
                            <button class="action-button copy" @click="copyOTP(otp.code)">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round">
                                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                </svg>
                                Copy
                            </button>
                            <button class="action-button refresh" @click="fillOtp(otp.code)">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round">
                                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                    <path d="M3 3v5h5" />
                                </svg>
                                fill
                            </button>
                        </div>
                    </div>
                </TransitionGroup>
            </div>
            <div class="otp-list d-flex align-items-center justify-content-center" v-else>
                <span style="font-size: 14px;">Empty</span>
            </div>

        </div>
    </div>


</template>

<script setup>
import moment from 'moment';
    import {
        ref,
        onMounted,
        onUnmounted,
        computed,defineProps, defineEmits
    } from 'vue';

    const props = defineProps({
        otpList:{
            type:Array,
            reuired:true,
            default:[]
        }
    });

    let search = ref('');

    const emits = defineEmits(['fill', 'clear']);


    

    const otpCodes = ref([{
            source: 'Google',
            code: '385 291',
            timeLeft: 30,
            color: '#4285F4',
            showActions: false,
            selected: false
        },
        {
            source: 'Microsoft',
            code: '472 183',
            timeLeft: 25,
            color: '#00A4EF',
            showActions: false,
            selected: false
        },
        {
            source: 'Dropbox',
            code: '219 847',
            timeLeft: 18,
            color: '#0061FF',
            showActions: false,
            selected: false
        },
        {
            source: 'GitHub',
            code: '653 912',
            timeLeft: 12,
            color: '#24292E',
            showActions: false,
            selected: false
        },
        {
            source: 'AWS',
            code: '129 456',
            timeLeft: 8,
            color: '#FF9900',
            showActions: false,
            selected: false
        },
        {
            source: 'Marketplace',
            code: '027 342',
            timeLeft: 8,
            color: '#FF9900',
            showActions: false,
            selected: false
        }
    ]);
    

    const computedOtpList = computed(()=>{
        if(!search.value || search.value==='') return (props.otpList ?? [])
        else{
            return (props?.otpList.filter((item)=> item.source.toLowerCase().includes(search.value.toLowerCase())) ?? []);
        }
    })

    // Timer to update the OTP countdown
    let timer;

    onMounted(() => {
        timer = setInterval(() => {
            otpCodes.value.forEach(otp => {
                otp.timeLeft -= 1;
                if (otp.timeLeft <= 0) {
                    // Generate a new OTP code when time expires
                    otp.timeLeft = 30;
                    otp.code = generateRandomOTP();
                }
            });
        }, 1000);
    });

    onUnmounted(() => {
        clearInterval(timer);
    });

    function generateRandomOTP() {
        const num1 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const num2 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${num1} ${num2}`;
    }

    function copyOTP(code) {
        navigator.clipboard.writeText(code.replace(' ', ''));
        //alert(`OTP ${code} copied to clipboard!`);
    }

    function refreshOTP(index) {
        otpCodes.value[index].code = generateRandomOTP();
        otpCodes.value[index].timeLeft = 30;
    }

    function clearHistory (){
        emits('clear');
    }

    function fillOtp(_otp_code){
        emits('fill', _otp_code);
    }
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
    .otp-search{
        padding: 0 8px 12px;
        position: relative;
    }
    .otp-search input{
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
    .otp-search input:focus{
        border-color: var(--primary);
        transition: 0.4s ease-in-out;
        width: 100%;
        box-shadow: 0px 1px 9px var(--primary);
    }
    .otp-search input:disabled{
        cursor: not-allowed;
    }
    .otp-item {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        margin-bottom: 6px;
        border-radius: 10px;
        position: relative;
        transition: all 0.2s ease;
        position: relative;
    }
    .otp-item::before{
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
        max-width: 165px;
    }

    .otp-source {
        font-size: 12px;
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
        font-size: 11px;
        font-weight: 600;
        margin-bottom: 4px;
        max-width: 80px;
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
    .bi-search{
        top: 5px;
        position: absolute;
        left: 19px;
        z-index: 3;
        color: #b8b7b7;
        font-size: 14px;
    }
    button:focus{
        outline: none !important;
    }
   
</style>
