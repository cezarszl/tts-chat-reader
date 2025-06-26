<template>
  <div class="flex h-screen bg-gray-50 overflow-hidden">
    <!-- Sidebar (contacts) -->
    <aside class="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      <!-- Header -->
      <div class="p-6 border-b border-gray-100">
        <h2 class="text-xl font-bold text-gray-900 flex items-center gap-3">
          <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
          Signal Kontakty
        </h2>
      </div>

      <!-- Contacts list -->
      <div class="flex-1 overflow-y-auto">
        <ul class="divide-y divide-gray-100">
          <li
            v-for="contact in contactList"
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
                {{ contact.id.charAt(0).toUpperCase() }}
              </div>

              <!-- Contact info -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-900 truncate">
                  {{ contact.name }}
                </p>
                <p class="text-xs text-gray-500 truncate">Bezpieczna wiadomość...</p>
              </div>

              <!-- Status and time -->
              <div class="flex flex-col items-end gap-1">
                <span class="text-xs text-gray-400">15:42</span>
                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
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
              {{ selectedContact?.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900">{{ selectedContact }}</h2>
              <p class="text-sm text-blue-600 flex items-center gap-1">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                Zaszyfrowane end-to-end
              </p>
            </div>

            <!-- Action buttons -->
            <div class="ml-auto flex items-center gap-2">
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
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </header>

        <!-- Messages area -->
        <div class="overflow-y-auto p-6 space-y-4">
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
                <svg
                  v-if="msg.from === 'me'"
                  class="w-3 h-3 -ml-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z"
                    clip-rule="evenodd"
                  />
                </svg>
              </p>
            </div>
          </div>

          <!-- Encryption notice -->
          <div class="flex justify-center my-8">
            <div
              class="bg-blue-100 border border-blue-200 rounded-lg px-4 py-2 flex items-center gap-2 text-xs text-blue-700"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd"
                />
              </svg>
              Twoje wiadomości są chronione szyfrowaniem end-to-end
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
import { ref, onMounted } from 'vue'

const baseUrl = import.meta.env.VITE_API_BASE_URL
const contactList = ref<{ id: string; name: string }[]>([])
const selectedContact = ref<string | null>(null)
const messages = ref<{ from: string; body: string; timestamp: number }[]>([])
const newMessage = ref('')
const myNumber = ref('+4917623237640') // <- tu możesz wpisać własny numer

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const fetchMessages = async () => {
  try {
    const res = await fetch(`${baseUrl}/api/signal/contacts`)
    if (!res.ok) throw new Error('Błąd pobierania kontaktów')

    const data = await res.json()
    contactList.value = data

    if (selectedContact.value) {
      const messagesRes = await fetch(`${baseUrl}/api/signal/messages?from=${myNumber.value}`)
      const messagesData = await messagesRes.json()
      messages.value = messagesData[selectedContact.value] || []
    }
  } catch (error) {
    console.error('Błąd:', error)
  }
}

console.log(contactList)
const selectContact = async (contactId: string) => {
  selectedContact.value = contactId

  try {
    await fetchMessages()
  } catch (error) {
    messages.value = [
      {
        from: contactId,
        body: 'Cześć! Jak się masz?',
        timestamp: Date.now() - 3600000,
      },
      {
        from: 'me',
        body: 'Wszystko w porządku, dzięki! A u Ciebie?',
        timestamp: Date.now() - 3500000,
      },
      {
        from: contactId,
        body: 'Świetnie! Czy możemy się spotkać jutro?',
        timestamp: Date.now() - 3400000,
      },
      {
        from: 'me',
        body: 'Jasne, o której godzinie?',
        timestamp: Date.now() - 3300000,
      },
      {
        from: contactId,
        body: 'Może o 15:00 w kawiarni na rogu?',
        timestamp: Date.now() - 3200000,
      },
    ]
  }
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
  fetchMessages()
})
</script>
