<template>
  <label
    for="file-upload"
    class="cursor-pointer text-blue-600 hover:text-blue-800 transition font-medium"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="w-7 h-7"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a4 4 0 10-5.656-5.656L5.929 12.243a6 6 0 108.485 8.485L20 15"
      />
    </svg>

    <input id="file-upload" type="file" class="hidden" @change="handleFileUpload" />
  </label>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'file-selected', file: File): void
}>()

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) emit('file-selected', file)
}
</script>
