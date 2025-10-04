<template>
  <div class="whatsapp-login">
    <div v-if="!qr && !loading" class="space-y-3">
      <p>Zaloguj się do WhatsApp.</p>
      <button @click="start" class="px-4 py-2 rounded border">Pokaż kod QR</button>
    </div>

    <div v-if="loading" class="py-2">Generuję kod QR...</div>

    <div v-if="qr" class="mt-4">
      <img :src="qr" alt="WhatsApp QR" class="w-72 h-72 object-contain border rounded" />
      <div class="mt-2 text-sm text-gray-600">
        W aplikacji WhatsApp otwórz: <br />
        <strong>Menu → Połączone urządzenia → Połącz urządzenie</strong> i zeskanuj ten kod.
      </div>
      <button @click="cancel" class="mt-3 px-3 py-2 rounded border">Anuluj</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

const baseUrl = import.meta.env.VITE_API_BASE_URL
const emit = defineEmits<{ (e: 'authenticated'): void }>()

const loading = ref(false)
const qr = ref<string | null>(null)
let timer: number | undefined

async function start() {
  try {
    loading.value = true
    qr.value = null
    pollQr()
  } catch (e) {
    loading.value = false
    console.error('WhatsApp start error', e)
  }
}

function pollQr() {
  timer = window.setInterval(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/whatsapp/auth/qr`)
      if (res.status === 200) {
        const data = await res.json()
        if (data.qr === false) {
          // już zalogowany
          cleanup()
          emit('authenticated')
          return
        }
        if (data.qr) {
          qr.value = data.qr
          loading.value = false
        }
      }
      // 404 => QR jeszcze niegotowy – czekamy
    } catch (e) {
      console.error('WhatsApp QR poll error', e)
    }
  }, 1000)
}

async function cancel() {
  try {
    await fetch(`${baseUrl}/api/whatsapp/auth/cancel`, { method: 'POST' })
  } finally {
    cleanup()
  }
}

function cleanup() {
  if (timer) {
    clearInterval(timer)
    timer = undefined
  }
  loading.value = false
  qr.value = null
}

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.whatsapp-login {
  max-width: 28rem;
}
</style>
