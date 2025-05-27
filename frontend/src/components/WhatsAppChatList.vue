<template>
    <div>
      <h2>Czaty z tej sesji</h2>
      <ul v-if="messages.length > 0">
        <li v-for="(msg, index) in messages" :key="index">
          <strong>{{ msg.from }}</strong>: {{ msg.body }}
        </li>
      </ul>
      <p v-else>Brak wiadomości przychodzących</p>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue';
  
  interface Message {
    from: string;
    body: string;
    timestamp: number;
  }
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const messages = ref<Message[]>([]);
  
  onMounted(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/whatsapp/messages`);
      if (res.ok) {
        messages.value = await res.json();
      }
    } catch (e) {
      console.error('❌ Nie udało się pobrać wiadomości', e);
    }
  });
  </script>
  