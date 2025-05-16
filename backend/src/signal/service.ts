import { signalSend, signalReceive } from './index';

export const sendTextMessage = async (from: string, to: string, message: string) => {
    return await signalSend(from, to, message);
};

export const receiveMessages = async (from: string) => {
    return await signalReceive(from);
};
