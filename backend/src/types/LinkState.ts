import { ChildProcessWithoutNullStreams } from "child_process";

export type LinkState = {
    child?: ChildProcessWithoutNullStreams;
    qrDataUrl?: string | null;
    startedAt?: number;
    completed?: boolean;
    timeout?: NodeJS.Timeout;
};