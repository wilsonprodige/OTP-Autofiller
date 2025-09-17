<template>
  <div class="otp-item rate-limit-notif">
    <audio :src="audioUrl" ref="notifAudioPlayer" allow="autoplay" autoplay muted></audio>

    <div class="otp-avatar" style="background-color: #f44336">
      !
    </div>

    <div class="otp-details">
      <div class="otp-source">Rate Limit Reached</div>
      <div class="otp-code">
        You have used all 5 OTPs allowed today.
      </div>
    </div>

    <div class="otp-actions">
      <button class="action-button copy" @click="$emit('close')">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        Close
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const emits = defineEmits(['close']);

const audioUrl = chrome.runtime.getURL('dist/audio/mixkit-bubble-pop-up-alert-notification-2357.wav');
const notifAudioPlayer = ref(null);

function unlockAudio() {
  const ctx = new AudioContext();
  const buffer = ctx.createBuffer(1, 1, 22050);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
  document.removeEventListener('click', unlockAudio);
}

onMounted(() => {
  document.addEventListener('click', unlockAudio);
  notifAudioPlayer.value.muted = false;
  notifAudioPlayer.value.play().catch(() => {});
  setTimeout(() => emits('close'), 10000); // auto-close after 10s
});
</script>

<style scoped>
/* Reuse .otp-item styles with some overrides */
.rate-limit-notif {
  background: #fff8f8;
  border-left: 4px solid #f44336;
}

.rate-limit-notif .otp-avatar {
  background-color: #f44336 !important;
  font-weight: bold;
}

.rate-limit-notif .otp-source {
  font-size: 14px;
  font-weight: 600;
  color: #c62828;
}

.rate-limit-notif .otp-code {
  font-size: 13px;
  color: #444;
}

.otp-item {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 6px;
  border-radius: 10px;
  position: relative;
  background: #ffffff;
  transition: all 0.2s ease;
  box-shadow: 0px 3px 18px rgba(0, 0, 0, 0.15);
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

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}
</style>