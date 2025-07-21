export type SessionMessage = {
    from: string;
    body: string;
    timestamp: number;
    mediaUrl?: string;
    mediaType?: string;
    audioId?: string;
};