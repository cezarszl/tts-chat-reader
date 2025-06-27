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

              <!-- Unread badge -->
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
              <!-- <p class="text-sm text-green-600">Online</p> -->
            </div>

            <!-- Action buttons -->
            <!-- <div class="ml-auto flex items-center gap-2">
              <button
                class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  ></path>
                </svg>
              </button>
              <button
                class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  ></path>
                </svg>
              </button>
            </div> -->
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
                <svg
                  v-if="msg.from === 'me'"
                  class="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
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
                class="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
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
  })
}

const fetchContacts = async () => {
  const res = await fetch(`${baseUrl}/api/whatsapp/contacts`)
  const data = (await res.json()) as Contact[]
  contacts.value = data.sort((a, b) => (b.lastTimestamp ?? 0) - (a.lastTimestamp ?? 0))
}

const selectContact = async (contactId: string) => {
  selectedContact.value = contactId

  const contact = contacts.value.find((c) => c.id === contactId)
  selectedContactName.value = contact?.name ?? contactId

  const res = await fetch(`${baseUrl}/api/whatsapp/messages/${contactId}`)

  messages.value = await res.json()

  unreadMap.value[contactId] = 0
}

const sendMessage = async () => {
  if (!selectedContact.value || !newMessage.value.trim()) return

  await fetch(`${baseUrl}/api/whatsapp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: selectedContact.value, message: newMessage.value }),
  })

  messages.value.push({
    from: 'me',
    body: newMessage.value,
    timestamp: Date.now(),
  })

  newMessage.value = ''
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)

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
    }

    if (data.contactId !== selectedContact.value) {
      unreadMap.value[data.contactId] = (unreadMap.value[data.contactId] || 0) + 1
    }
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
