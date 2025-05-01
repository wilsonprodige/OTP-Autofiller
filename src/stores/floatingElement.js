import { defineStore } from 'pinia'

export const useFloatingElementStore = defineStore('floatingElement', {
  state: () => ({
    right: 20,
    bottom: 20,
  }),
  actions: {
    setRight(value) {
      this.right = value
    },
    setBottom(value) {
      this.right = value
    },
    updatePosition({ right, bottom }) {
      if (right !== undefined) this.right = right
      if (bottom !== undefined) this.bottom = bottom
    },
  },
})