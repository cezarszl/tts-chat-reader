import { createRouter, createWebHistory } from 'vue-router';
import WhatsAppPage from './components/WhatsAppPage.vue';
import SignalChatList from './components/SignalChatList.vue';

const routes = [
    {
        path: '/whatsapp',
        component: WhatsAppPage,
    },
    {
        path: '/signal',
        component: SignalChatList,
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
