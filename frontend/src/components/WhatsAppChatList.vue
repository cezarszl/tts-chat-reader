<template>
    <div class="flex h-screen overflow-hidden">
      <!-- Sidebar (contacts) -->
      <aside class="w-1/3 bg-gray-100 border-r border-gray-300 overflow-y-auto p-4">
        <h2 class="text-lg font-semibold mb-4">Kontakty</h2>
        <ul class="space-y-2">
          <li
            v-for="contact in contacts"
            :key="contact.id"
            @click="selectContact(contact.id)"
            :class="[
              'cursor-pointer p-2 rounded hover:bg-gray-200',
              contact.id === selectedContact ? 'bg-gray-300 font-bold' : ''
            ]"
          >
            {{ contact.name }}
          </li>
        </ul>
      </aside>
  
      <!-- Main chat area -->
      <main class="flex-1 flex flex-col p-4 overflow-hidden">
        <div v-if="selectedContact" class="flex-1 flex flex-col overflow-hidden">
          <h2 class="text-xl font-semibold mb-4">Czat z: {{ selectedContact }}</h2>
          <div class="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
            <div
              v-for="msg in messages"
              :key="msg.timestamp"
              :class="[
                'max-w-[70%] p-2 rounded shadow text-sm',
                msg.from === 'me'
                  ? 'self-end bg-green-100 text-right'
                  : 'self-start bg-white border'
              ]"
            >
              <p class="text-xs text-gray-500 mb-1">{{ msg.from === 'me' ? 'Ty' : msg.from }}</p>
              <p>{{ msg.body }}</p>
            </div>
          </div>
  
          <!-- Message input -->
          <form @submit.prevent="sendMessage" class="flex gap-2 mt-auto">
            <input
              v-model="newMessage"
              placeholder="Napisz wiadomość..."
              class="flex-1 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring"
            />
            <button
              type="submit"
              class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Wyślij
            </button>
          </form>
        </div>
  
        <div v-else class="text-gray-500 text-center my-auto">
          Wybierz kontakt, aby rozpocząć czat
        </div>
      </main>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue';
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  
  const contacts = ref<{ id: string; name: string }[]>([]);
  const selectedContact = ref<string | null>(null);
  const messages = ref<{ from: string; body: string; timestamp: number }[]>([]);
  const newMessage = ref('');
  
  const fetchContacts = async () => {
    const res = await fetch(`${baseUrl}/api/whatsapp/contacts`);
    contacts.value = await res.json();
  };
  
  const selectContact = async (contact: string) => {
    selectedContact.value = contact;
    const res = await fetch(`${baseUrl}/api/whatsapp/messages/${contact}`);
    messages.value = await res.json();
  };
  
  const sendMessage = async () => {
    if (!selectedContact.value || !newMessage.value) return;
  
    await fetch(`${baseUrl}/api/whatsapp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: selectedContact.value, message: newMessage.value }),
    });
  
    messages.value.push({
      from: 'me',
      body: newMessage.value,
      timestamp: Date.now(),
    });
  
    newMessage.value = '';
  };
  
  onMounted(() => {
  fetchContacts();

  const ws = new WebSocket(baseUrl.replace(/^http/, 'ws')); // ws://localhost:3000

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.contact === selectedContact.value) {
      messages.value.push({
        from: data.from,
        body: data.body,
        timestamp: data.timestamp,
      });
    }
  };
});
  </script>
  