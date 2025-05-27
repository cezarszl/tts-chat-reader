import { createRouter, createWebHistory } from 'vue-router';
import WhatsAppLogin from './components/WhatsAppLogin.vue';

const routes = [
    {
        path: '/whatsapp',
        component: WhatsAppLogin,
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
