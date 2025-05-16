<template>

<div v-if="qr">
    <img :src="qr" alt="Scan the QR code to log in" />
</div>

<p v-else>Loading QR code...</p>

</template>


<script setup lang="ts">
import { ref, onMounted } from 'vue';

const qr = ref<string| null>(null);

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:3000/auth/qr');
    const data = await res.json();
    console.log('QR:', data);
    qr.value = data.qr;
  } catch (e) {
    console.error('❌ Fetch QR failed', e);
  }
});

 </script>