import { createApp } from 'vue'
import FloatingButton from './components/FloatingButton.vue'

console.log('Script evaluation started') // Should appear first

// Check if Vue is actually available
console.log('Vue availability:', typeof createApp)

// Verify component import
console.log('FloatingButton component:', FloatingButton)

// Check DOM injection
console.log('Mount point exists:', !!document.getElementById('otp-autofiller-extension-floating-btn'))



console.log('---injecting--otp-floater---');
const mountPoint = document.createElement('div')
mountPoint.id = 'otp-autofiller-extension-floating-btn'
document.body.appendChild(mountPoint)


createApp(FloatingButton).mount('#otp-autofiller-extension-floating-btn')