<template>
  <div>
    <div v-if="loading" class="p-10 text-center text-gray-500">Weryfikacja sesji Signal...</div>

    <div v-else>
      <SignalLogin v-if="!isAuthenticated" @authenticated="handleAuthenticated" />
      <SignalChatList v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import SignalChatList from './SignalChatList.vue'
import SignalLogin from './SignalLogin.vue'

const baseUrl = import.meta.env.VITE_API_BASE_URL

const isAuthenticated = ref(false)
const loading = ref(true)
let interval: ReturnType<typeof setInterval> | undefined

async function fetchSession(): Promise<boolean> {
  const res = await fetch(`${baseUrl}/api/signal/session`)
  const data = await res.json()
  return !!data.authenticated
}

const checkSession = async () => {
  loading.value = true
  try {
    isAuthenticated.value = await fetchSession()
  } catch {
    isAuthenticated.value = false
  } finally {
    loading.value = false
  }
}

const handleAuthenticated = () => {
  isAuthenticated.value = true
}

onMounted(() => {
  checkSession()

  interval = setInterval(async () => {
    try {
      const authed = await fetchSession()
      if (!authed && isAuthenticated.value) isAuthenticated.value = false
    } catch {
      if (isAuthenticated.value) isAuthenticated.value = false
    }
  }, 60000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>
