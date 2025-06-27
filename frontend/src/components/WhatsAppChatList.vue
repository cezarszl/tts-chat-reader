<template>
  <div class="flex h-screen bg-gray-50 overflow-hidden">
    <!-- Sidebar (contacts) -->
    <aside class="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      <!-- Header -->
      <div class="p-6 border-b border-gray-100">
        <h2 class="text-xl font-bold text-gray-900 flex items-center gap-3">
          <div class="w-3 h-3 bg-green-500 rounded-full"></div>
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
              contact.id === selectedContact ? 'bg-green-50 border-r-3 border-green-500' : '',
            ]"
          >
            <div class="flex items-center gap-4">
              <!-- Avatar -->
              <div
                class="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md"
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
                <span
                  v-if="unreadMap[contact.id]"
                  class="bg-green-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm animate-pulse"
                >
                  {{ unreadMap[contact.id] }}
                </span>
              </div>
            </div>

            <!-- Hover indicator -->
            <div
              class="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-green-500 rounded-r opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            ></div>
          </li>
        </ul>
      </div>
    </aside>

    <!-- Main chat area -->
    <main class="flex-1 bg-gradient-to-b from-green-50 to-white overflow-hidden">
      <div v-if="selectedContact" class="h-full grid grid-rows-[auto_1fr_auto]">
        <!-- Chat header -->
        <header class="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div class="flex items-center gap-4">
            <div
              class="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md"
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
                  ? 'bg-green-500 text-white rounded-br-sm'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm',
              ]"
            >
              <!-- Message tail -->
              <div
                v-if="msg.from === 'me'"
                class="absolute -right-1 bottom-0 w-0 h-0 border-l-8 border-l-green-500 border-t-8 border-t-transparent"
              ></div>
              <div
                v-else
                class="absolute -left-1 bottom-0 w-0 h-0 border-r-8 border-r-white border-t-8 border-t-transparent"
              ></div>

              <p class="text-sm leading-relaxed">{{ msg.body }}</p>
              <p
                :class="[
                  'text-xs mt-1 flex items-center gap-1',
                  msg.from === 'me' ? 'text-green-100 justify-end' : 'text-gray-400',
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
                placeholder="Type a message..."
                class="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
                rows="1"
              />
              <!-- Emoji toggle button -->
              <button
                type="button"
                @click.stop="toggleEmojiPicker"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                😀
              </button>

              <!-- Emoji picker -->
              <div
                v-if="showEmojiPicker"
                ref="emojiPickerRef"
                class="absolute bottom-16 right-6 z-50"
              >
                <Picker :data="emojiIndex" set="apple" @select="addEmoji" />
              </div>
            </div>
            <button
              type="submit"
              :disabled="!newMessage.trim()"
              class="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100"
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
            class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-12 h-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              ></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Welcome to WhatsApp Web</h3>
          <p class="text-gray-500 max-w-sm">
            Select a contact from the list on the left to start a conversation
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Picker, EmojiIndex } from 'emoji-mart-vue-fast/src'
import emojiData from 'emoji-mart-vue-fast/data/all.json'
import 'emoji-mart-vue-fast/css/emoji-mart.css'

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
const unreadMap = ref<Record<string, number>>({})

/* Emoji picker */
const showEmojiPicker = ref(false)
const emojiPickerRef = ref<HTMLElement | null>(null)
const emojiIndex = new EmojiIndex(emojiData)

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
}

const handleClickOutside = (event: MouseEvent) => {
  if (emojiPickerRef.value && !emojiPickerRef.value.contains(event.target as Node)) {
    showEmojiPicker.value = false
  }
}

const addEmoji = (emoji: any) => {
  newMessage.value += emoji.native
}

/* Messages */
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
  const res = await fetch(`${baseUrl}/api/whatsapp/contacts`)
  const data = (await res.json()) as Contact[]
  contacts.value = data.sort((a, b) => (b.lastTimestamp ?? 0) - (a.lastTimestamp ?? 0))
}

const fetchMessages = async (contactId: string) => {
  try {
    const res = await fetch(`${baseUrl}/api/whatsapp/messages/${contactId}`)
    if (!res.ok) throw new Error('Failed to fetch messages')

    messages.value = await res.json()
  } catch (err) {
    console.error(`Error fetching messages for ${contactId}:`, err)
    messages.value = []
  }
}

const selectContact = async (contactId: string) => {
  selectedContact.value = contactId

  const contact = contacts.value.find((c) => c.id === contactId)
  selectedContactName.value = contact?.name ?? contactId
  unreadMap.value[contactId] = 0

  await fetchMessages(contactId)
}

const sendMessage = async () => {
  if (!selectedContact.value || !newMessage.value.trim()) return

  await fetch(`${baseUrl}/api/whatsapp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: selectedContact.value, message: newMessage.value }),
  })

  newMessage.value = ''
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)

  fetchContacts()

  const ws = new WebSocket(baseUrl.replace(/^http/, 'ws'))

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)

    if (location.pathname.includes('/signal') && data.source !== 'signal') return
    if (location.pathname.includes('/whatsapp') && data.source !== 'whatsapp') return

    const newMsg = {
      from: data.from,
      body: data.body,
      timestamp: data.timestamp,
    }

    if (data.contactId === selectedContact.value) {
      messages.value.push(newMsg)
    } else {
      unreadMap.value[data.contactId] = (unreadMap.value[data.contactId] || 0) + 1
    }

    const contactIndex = contacts.value.findIndex((c) => c.id === data.contactId)
    if (contactIndex !== -1) {
      const contact = contacts.value[contactIndex]

      contact.lastMessage = newMsg.body
      contact.lastTimestamp = newMsg.timestamp

      contacts.value.splice(contactIndex, 1)
      contacts.value.unshift(contact)
    } else {
      contacts.value.unshift({
        id: data.contactId,
        name: data.contactId,
        lastMessage: newMsg.body,
        lastTimestamp: newMsg.timestamp,
      })
    }
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
