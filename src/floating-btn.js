import { createApp } from 'vue'
import FloatingButton from './components/FloatingButton.vue'

const mountPoint = document.createElement('div')
mountPoint.id = 'otp-autofiller-extension-floating-btn'
document.body.appendChild(mountPoint)


createApp(FloatingButton).mount('#otp-autofiller-extension-floating-btn')