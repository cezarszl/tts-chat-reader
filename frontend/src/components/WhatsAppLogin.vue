<template>
  <img v-if="typeof qr === 'string'" :src="qr" alt="Scan the QR code to log in" />

  <p v-else-if="qr === null">Ładowanie kodu QR...</p>
  <!-- <p v-else-if="qr === false">Już zalogowany ✅</p> -->
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
const baseUrl = import.meta.env.VITE_API_BASE_URL

const qr = ref<string | boolean | null>(null)
const emit = defineEmits(['authenticated'])

onMounted(async () => {
  try {
    const res = await fetch(`${baseUrl}/api/whatsapp/auth/qr`)
    if (res.ok) {
      const data = await res.json()
      qr.value = data.qr
    } else {
      qr.value = false
      emit('authenticated')
    }
  } catch (e) {
    console.error('❌ Fetch QR failed', e)
    qr.value = false
    emit('authenticated')
  }
})
</script>
