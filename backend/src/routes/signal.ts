import { Router } from "express";
import upload from "../middleware/upload";
import {
    MY_NUMBER,
    cancelSignalLink,
    getSignalQrBase64,
    isLinkingInProgress,
    isSignalLinked,
    knownNames,
    removeSession,
    sendSignalMediaMessage,
    sessionMessages,
    signalSend,
    startSignalLink,
    verifySignalSession,
} from "../signal";

const router = Router();

async function safeResetAndStartLink() {
    await removeSession();
    if (!isLinkingInProgress()) startSignalLink();
}

router.post("/auth/start", async (_req, res) => {
    const hasFiles = await isSignalLinked();

    if (hasFiles) {
        const isValid = await verifySignalSession();
        if (isValid) return res.status(200).json({ ok: true, alreadyLinked: true });
        await safeResetAndStartLink();
        return res.status(202).json({ ok: true });
    }

    if (!isLinkingInProgress()) startSignalLink();
    return res.status(202).json({ ok: true });
});

router.get("/auth/qr", async (_req, res) => {
    const hasFiles = await isSignalLinked();

    if (hasFiles) {
        const isValid = await verifySignalSession();
        if (isValid) return res.status(200).json({ qr: false });
        await safeResetAndStartLink();
    }

    const qr = getSignalQrBase64();
    if (qr) return res.status(200).json({ qr });
    return res.status(404).json({ error: "QR code not ready" });
});

router.post("/auth/cancel", (_req, res) => {
    cancelSignalLink();
    return res.json({ ok: true });
});

router.get("/session", async (_req, res) => {
    const hasFiles = await isSignalLinked();
    if (!hasFiles) return res.json({ authenticated: false });

    const isValid = await verifySignalSession();
    if (!isValid) return res.json({ authenticated: false, error: "Session revoked" });

    return res.json({ authenticated: true });
});

router.post("/send", async (req, res) => {
    const { to, message } = req.body as { to?: string; message?: string };

    if (!to || typeof to !== "string") return res.status(400).json({ success: false, error: 'Missing "to"' });
    if (!message || typeof message !== "string") return res.status(400).json({ success: false, error: 'Missing "message"' });

    try {
        const result = await signalSend(MY_NUMBER, to, message);
        return res.json({ success: true, output: result });
    } catch (err) {
        return res.status(500).json({ success: false, error: err });
    }
});

router.get("/messages", (req, res) => {
    const contactId = req.query.contactId as string | undefined;
    if (!contactId) return res.status(400).json({ error: 'Missing "contactId"' });
    return res.json(sessionMessages[contactId] || []);
});

router.get("/contacts", async (_req, res) => {
    const contacts = Object.keys(sessionMessages).map((id) => {
        const name = knownNames[id] || id;
        const messages = sessionMessages[id] ?? [];
        const lastMessage = messages[messages.length - 1];

        return {
            id,
            name,
            lastMessage: lastMessage?.body ?? null,
            lastTimestamp: lastMessage?.timestamp ?? null,
        };
    });

    contacts.sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0));
    return res.json(contacts);
});

router.post("/send-media", upload.single("file"), async (req, res) => {
    const { to, from } = req.body as { to?: string; from?: string };

    if (!to || typeof to !== "string") return res.status(400).json({ error: 'Missing "to"' });
    if (!from || typeof from !== "string") return res.status(400).json({ error: 'Missing "from"' });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const isImage = req.file.mimetype.startsWith("image/");
    const isVideo = req.file.mimetype.startsWith("video/");
    if (!isImage && !isVideo) return res.status(400).json({ error: "Only image and video supported" });

    try {
        await sendSignalMediaMessage({ from, to, filePath: req.file.path });
        return res.json({ success: true });
    } catch (err) {
        console.error("Failed to send media", err);
        return res.status(500).json({ error: "Internal error" });
    }
});

export default router;
