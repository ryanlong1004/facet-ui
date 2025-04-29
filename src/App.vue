<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <main>
    <!-- <header class="bg-blue-600 text-white py-4 w-full text-center">
      <h1 class="text-3xl font-bold">LFW Gallery</h1>
      <nav class="mt-2">
        <RouterLink to="/" class="text-white hover:text-gray-300 mx-2">Home</RouterLink>
        <RouterLink to="/about" class="text-white hover:text-gray-300 mx-2">About</RouterLink>
      </nav>
    </header> -->



    <div>
      <RouterView />
    </div>
  </main>
</template>

<style scoped>
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  /* font-family: 'Inter', sans-serif; */
}

main {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  /* justify-content: center; */
  gap: 10px;
  min-height: 100vh;
  width: 100%;
}

/* header {
  background-color: #f8f9fa;
  padding: 20px;
  text-align: center;
  position: fixed;
}

nav {
  background-color: (137, 236, 163);
}

.footer {
  background-color: #f8f9fa;
  padding: 20px;
  text-align: center;
  position: fixed;
  bottom: 0;
  width: 100%;
} */
</style>
