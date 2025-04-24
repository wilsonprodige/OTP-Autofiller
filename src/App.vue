<template class>

  <!-- <nav>
    <router-link to="/">Home</router-link> |
    <router-link to="/about">About</router-link>
  </nav> -->
  <div style="width: 100%;height: 100%;overflow: scroll;">
    <router-view/>
  </div>
  
</template>

<style lang="scss">
#app {
  background-color: var(--background-color);
  color: var(--text-color);
  width: 300px;
  height: 500px;
  box-sizing: border-box;
  overflow: hidden;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  border-radius: 20px;
  border: 1px solid red;
}

nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
