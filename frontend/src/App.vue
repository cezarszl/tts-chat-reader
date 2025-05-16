<template>
  <div class="app">
    <h1>Hello from TTS Chat Reader</h1>
    <p>This is the frontend running inside Docker 🎉</p>
    <WhatsAppLogin />
  </div>
</template>

<script setup>
import WhatsAppLogin from './components/WhatsAppLogin.vue';
</script>

<style scoped>
.app {
  font-family: sans-serif;
  padding: 2rem;
}
</style>
