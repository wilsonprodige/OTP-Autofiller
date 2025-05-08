import { createApp } from 'vue'
import { createPinia } from 'pinia'
import FloatingButton from './components/FloatingButton.vue'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './assets/styles/global.css';




console.log('---injecting--otp-floater---');
if (!document.getElementById('otp-autofiller-extension-floating-btn')) {
    const mountPoint = document.createElement('div')
    mountPoint.id = 'otp-autofiller-extension-floating-btn'
    document.body.appendChild(mountPoint)


    createApp(FloatingButton).use(createPinia()).mount('#otp-autofiller-extension-floating-btn')
}
else{
    console.log('already injected--->');
}