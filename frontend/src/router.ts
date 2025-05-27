import { createRouter, createWebHistory } from 'vue-router';
import WhatsAppPage from './components/WhatsAppPage.vue';

const routes = [
    {
        path: '/whatsapp',
        component: WhatsAppPage,
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
