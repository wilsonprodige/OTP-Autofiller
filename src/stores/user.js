import { defineStore } from 'pinia';
import api , { setAuthHeader, clearAuthHeader } from '@/util/api';
import { storage } from '@/util/storage';
import { useFloatingElementStore } from './floatingElement';

export const useUserStore = defineStore('user', {
  state: () => ({
    isAuthenticated: false,
    userProfile: null,
    token:null
  }),
  getters:{
    isAuth(state){
        return state?.isAuthenticated;
    },
    getUser(state){
        return state?.userProfile
    }
  },
  actions: {
    async loginSignup(profile){
        try {
             const response = await api.post('/auth/google', profile);
             console.log('response----->', response );
             const { token, user } = response?.data

              this.token = token
              this.userProfile = user
              this.isAuthenticated = true

              setAuthHeader(token);

              await storage.setMultiple({
                isAuthenticated: true,
                token:token,
                userProfile: user
              })

              useFloatingElementStore().setFloatMenuStatus(true);
              
              return response?.data
          } catch (error) {
            console.error('auth failed:', error)
            throw error 
          }
    }, 
    async logout(){
        this.token = null
        this.userProfile = null
        this.isAuthenticated = false

        clearAuthHeader();

        await storage.clear();

        useFloatingElementStore().setFloatMenuStatus(false);

        return
    }
  },
})