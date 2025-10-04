<template>
  <div>
    <div>
      <SignalLogin v-if="!isAuthenticated" @authenticated="handleAuthenticated" />
      <SignalChatList v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SignalLogin from './SignalLogin.vue'
import SignalChatList from './SignalChatList.vue'

const baseUrl = import.meta.env.VITE_API_BASE_URL
const isAuthenticated = ref(false)

const checkSession = async () => {
  try {
    const res = await fetch(`${baseUrl}/api/signal/session`)
    const data = await res.json()
    isAuthenticated.value = !!data.authenticated
  } catch {
    isAuthenticated.value = false
  }
}

const handleAuthenticated = () => {
  isAuthenticated.value = true
}

onMounted(() => {
  checkSession()
})
</script>
