<template>

<div v-if="qr">
    <img :src="qr" alt="Scan the QR code to log in" />
</div>

<p v-else>Loading QR code...</p>

</template>


<script lang="ts">
import { ref, onMounted } from 'vue';

const qr = ref<string| null>(null);

onMounted (async () => {
    const res = await fetch('http://localhost:3000/auth/qr');
    const data = await res.json();

    if(data.qr) qr.value = data.qr;
});
 </script>