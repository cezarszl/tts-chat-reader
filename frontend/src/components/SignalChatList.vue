<template>
  <div class="flex h-screen bg-gray-50 overflow-hidden">
    <!-- Sidebar (contacts) -->
    <aside class="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      <!-- Header -->
      <div class="p-6 border-b border-gray-100">
        <h2 class="text-xl font-bold text-gray-900 flex items-center gap-3">
          <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
          Contacts
        </h2>
      </div>

      <!-- Contacts list -->
      <div class="flex-1 overflow-y-auto">
        <ul class="divide-y divide-gray-100">
          <li
            v-for="contact in contacts"
            :key="contact.id"
            @click="selectContact(contact.id)"
            :class="[
              'cursor-pointer px-6 py-4 hover:bg-gray-50 transition-all duration-200 relative group',
              selectedContact === contact.id ? 'bg-blue-50 border-r-3 border-blue-500' : '',
            ]"
          >
            <div class="flex items-center gap-4">
              <!-- Avatar -->
              <div
                class="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md"
              >
                {{ contact.name.charAt(0).toUpperCase() }}
              </div>

              <!-- Contact info -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-900 truncate">
                  {{ contact.name }}
                </p>
                <p class="text-xs text-gray-500 truncate">{{ contact.lastMessage }}</p>
              </div>

              <!-- Status and time -->
              <div class="flex flex-col items-end gap-1">
                <span class="text-xs text-gray-400">{{ formatTime(contact.lastTimestamp) }}</span>
              </div>
            </div>

            <!-- Hover indicator -->
            <div
              class="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            ></div>
          </li>
        </ul>
      </div>
    </aside>

    <!-- Main chat area -->
    <main class="flex-1 bg-gradient-to-b from-blue-50 to-white overflow-hidden">
      <div v-if="selectedContact" class="h-full grid grid-rows-[auto_1fr_auto]">
        <!-- Chat header -->
        <header class="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div class="flex items-center gap-4">
            <div
              class="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md"
            >
              {{ selectedContactName?.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900">{{ selectedContactName }}</h2>
            </div>
          </div>
        </header>

        <!-- Messages area -->
        <div ref="messageContainer" class="overflow-y-auto p-6 space-y-4">
          <div
            v-for="(msg, index) in messages"
            :key="msg.timestamp"
            :class="['flex', msg.from === 'me' ? 'justify-end' : 'justify-start']"
          >
            <div
              :class="[
                'max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm relative',
                msg.from === 'me'
                  ? 'bg-blue-500 text-white rounded-br-sm'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm',
              ]"
            >
              <!-- Message tail -->
              <div
                v-if="msg.from === 'me'"
                class="absolute -right-1 bottom-0 w-0 h-0 border-l-8 border-l-blue-500 border-t-8 border-t-transparent"
              ></div>
              <div
                v-else
                class="absolute -left-1 bottom-0 w-0 h-0 border-r-8 border-r-white border-t-8 border-t-transparent"
              ></div>

              <p class="text-sm leading-relaxed">{{ msg.body }}</p>
              <p
                :class="[
                  'text-xs mt-1 flex items-center gap-1',
                  msg.from === 'me' ? 'text-blue-100 justify-end' : 'text-gray-400',
                ]"
              >
                {{ formatTime(msg.timestamp) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Message input -->
        <div class="bg-white border-t border-gray-200 p-4">
          <form @submit.prevent="sendMessage" class="flex items-end gap-3">
            <div class="flex-1 relative">
              <input
                v-model="newMessage"
                placeholder="Napisz bezpieczną wiadomość..."
                class="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                rows="1"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  ></path>
                </svg>
              </button>
            </div>
            <button
              type="submit"
              :disabled="!newMessage.trim()"
              class="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                ></path>
              </svg>
            </button>
          </form>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <div
            class="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg class="w-12 h-12 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Witaj w Signal</h3>
          <p class="text-gray-500 max-w-sm mb-4">
            Wybierz kontakt z listy po lewej stronie, aby rozpocząć bezpieczną konwersację
          </p>
          <div
            class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-xs text-blue-700 inline-flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
            Prywatność jest domyślnie włączona
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'

const baseUrl = import.meta.env.VITE_API_BASE_URL

type Contact = {
  id: string
  name: string
  lastTimestamp: number | null
  lastMessage: string | null
}

const contacts = ref<Contact[]>([])
const selectedContact = ref<string | null>(null)
const selectedContactName = ref<string | null>(null)
const newMessage = ref('')
const myNumber = ref(import.meta.env.VITE_MY_PHONE_NUMBER)

const messages = ref<{ from: string; body: string; timestamp: number }[]>([])
const messageContainer = ref<HTMLElement | null>(null)

watch(
  messages,
  async () => {
    await nextTick()
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  },
  { deep: true, flush: 'post' },
)

const formatTime = (timestamp: number | null) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const fetchContacts = async () => {
  try {
    const res = await fetch(`${baseUrl}/api/signal/contacts`)
    if (!res.ok) throw new Error('Błąd pobierania kontaktów')

    const data = await res.json()
    contacts.value = data

    if (data.length > 0 && !selectedContact.value) {
      await selectContact(data[0].id)
    }
  } catch (error) {
    console.error('Błąd pobierania kontaktów:', error)
  }
}

const fetchMessages = async (contactId: string) => {
  try {
    const res = await fetch(
      `${baseUrl}/api/signal/messages?contactId=${encodeURIComponent(contactId)}`,
    )
    const data = await res.json()
    messages.value = data || []
  } catch (error) {
    console.error('Błąd pobierania wiadomości:', error)
    messages.value = []
  }
}

const selectContact = async (contactId: string) => {
  selectedContact.value = contactId
  const contact = contacts.value.find((c) => c.id === contactId)
  selectedContactName.value = contact?.name ?? contactId
  await fetchMessages(contactId)
}

const sendMessage = async () => {
  if (!selectedContact.value || !newMessage.value.trim()) return

  try {
    const res = await fetch(`${baseUrl}/api/signal/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: myNumber.value,
        to: selectedContact.value,
        message: newMessage.value,
      }),
    })

    if (res.ok) {
      messages.value.push({
        from: 'me',
        body: newMessage.value,
        timestamp: Date.now(),
      })
      newMessage.value = ''
    } else {
      throw new Error('Błąd wysyłania wiadomości')
    }
  } catch (error) {
    console.error('Błąd podczas wysyłania wiadomości:', error)
    messages.value.push({
      from: 'me',
      body: newMessage.value,
      timestamp: Date.now(),
    })
    newMessage.value = ''
  }
}

onMounted(() => {
  fetchContacts()

  const ws = new WebSocket(baseUrl.replace(/^http/, 'ws'))

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)

    if (data.contactId === selectedContact.value) {
      messages.value.push({
        from: data.from,
        body: data.body,
        timestamp: data.timestamp,
      })
    } else {
      console.log('🔔 Nowa wiadomość od:', data.contactId)
    }
  }
})
</script>
