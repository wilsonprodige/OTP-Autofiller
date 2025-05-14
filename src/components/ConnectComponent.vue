<template>

    <div class="container-fuild">
        <div class="widget-container">
            <div class="widget">
                <div class="header">
                    <div class="logo-container">
                        <div class="logo">O</div>
                        <h1 class="title">OTP-Autofiller</h1>
                    </div>
                    <div class="status">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" class="status-icon">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        Ready
                    </div>
                </div>

                <p class="description">
                    Connect your Google account to enable seamless data synchronization.
                </p>

                <button class="connect-button" @click="connectToGoogle">
                    <div class="button-content">
                        <svg class="google-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Connect with Google
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" class="chevron-icon">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                    <!---loader component-->
                    <div>
                        <LoaderComponent v-if="isLoading" :size="10"/>
                    </div>

                </button>

                <p class="terms">
                    By connecting, you agree to our Terms of Service and Privacy Policy.
                </p>
                <p>  user: {{userProfile?.email ?? 'none'}}</p>
            </div>
        </div>

    </div>
</template>

<script setup>
import {ref, reactive,onMounted} from 'vue';
import LoaderComponent from '../components/LoaderComponent.vue';

var isAuthenticated = ref(false);
var userProfile = ref(null);


const initGoogleAuth = () => {
      return new Promise((resolve) => {
        chrome.identity.getAuthToken({ interactive: false }, (token) => {
          if (chrome.runtime.lastError || !token) {
            resolve(false);
          } else {
            verifyTokenAndGetProfile(token).then(resolve);
          }
        });
      });
};



const isLoading = ref(false);
var error = ref(null);
const connectToGoogle = () =>{
    isLoading.value = true;
      error.value = null;
      
      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        isLoading.value = false;
        
        if (chrome.runtime.lastError) {
          error.value = chrome.runtime.lastError.message;
          return;
        }
        
        if (token) {
          const success = await verifyTokenAndGetProfile(token);
          if (!success) {
            error.value = 'Failed to authenticate';
          }
        }
      });
}
//verify token and get profile
const verifyTokenAndGetProfile = async (token) => {
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch user info');
        
        const profile = await response.json();
        userProfile.value = profile;
        // isAuthenticated.value = true;
        return true;
      } catch (err) {
        console.error('Profile fetch error:', err);
        logout();
        return false;
      }
};

//logout
const logout = () => {
      if (!userProfile.value) return;
      
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (token) {
          // Remove the cached token
          chrome.identity.removeCachedAuthToken({ token }, () => {
            isAuthenticated.value = false;
            userProfile.value = null;
            
            // Optional: Revoke the token on Google's server
            fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
              .catch(console.error);
          });
        }
      });
};

onMounted(async () => {
      isLoading.value = true;
      await initGoogleAuth();
      isLoading.value = false;
    });


</script>

<style scoped lang="scss">
    .widget-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: #f5f5f5;
        padding: 16px;
    }

    .widget {
        width: 100%;
        max-width: 340px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        padding: 24px;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        gap: 5px;
    }

    .logo-container {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .logo {
        width: 30px;
        height: 30px;
        background-color: var(--primary);
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #fff;
        font-size: 18px;
        font-weight: 700
    }

    .title {
        font-size: 15px;
        font-weight: 600;
        color: #333;
        margin: 0;
    }

    .status {
        display: flex;
        align-items: center;
        gap: 4px;
        background-color: #e6f7eb;
        color: #2e7d32;
        padding: 4px 10px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 500;
    }

    .status-icon {
        width: 14px;
        height: 14px;
    }

    .description {
        color: #555;
        font-size: 12px;
        line-height: 1.4;
        margin-bottom: 24px;
    }

    .connect-button {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background-color: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        transition: background-color .2s;
    }

    .connect-button:hover {
        background-color: #f8f8f8;
        border-color: var(--primary);
        transition: all 1s ease-in-out;
    }

    .button-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .google-icon {
        width: 18px;
        height: 18px;
    }

    .chevron-icon {
        color: #999;
    }

    .terms {
        font-size: 11px;
        color: #777;
        margin-top: 16px;
        line-height: 1.5;
    }
</style>
