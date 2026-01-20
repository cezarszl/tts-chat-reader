import cors from "cors";
import express from "express";
import { createServer } from "http";
import routes from "./routes";
import "./whatsapp";
import { setupWebSocket } from "./ws";
import { isSignalLinked, startSignalDaemon } from "./signal";
import { UPLOADS_DIR, ensureDirs } from "./config/paths";

const baseUrl = process.env.API_BASE_URL;
const port = Number(process.env.BACKEND_PORT || 3000);

export const SIGNAL_NUMBER = process.env.SIGNAL_PHONE_NUMBER!;

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", routes);

ensureDirs();
app.use("/uploads", express.static(UPLOADS_DIR));

const server = createServer(app);
setupWebSocket(server);

server.listen(port, async () => {
    console.log(`🚀 Backend running at ${baseUrl}:${port}`);

    if (await isSignalLinked()) {
        console.log("✅ Signal is linked. Starting daemon...");
        startSignalDaemon();
    } else {
        console.log("ℹ️ Signal not linked. Waiting for user action via Frontend.");
    }
});
