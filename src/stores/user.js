import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    isAuthenticated: false,
    userProfile: 0,
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
            
            // const response = await axios.post('/api/auth', credentials)
    
            // const { token, user } = response.data
    
            // // Save token and user data
            // this.token = token
            this.userProfile = profile
            this.isAuthenticated = true
    
            // Optionally persist token in localStorage
            // localStorage.setItem('auth_token', token)
            // axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          } catch (error) {
            console.error('auth failed:', error)
            throw error // Let the component handle UI feedback
          }
    }, 
    async logout(){
        this.token = null
        this.userProfile = null
        this.isAuthenticated = false
  
        localStorage.removeItem('auth_token')
        delete axios.defaults.headers.common['Authorization']
    }
  },
})