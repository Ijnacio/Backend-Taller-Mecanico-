export class DiscordLogger {
    private static webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    static sendError(message: string): void {
        if (!this.webhookUrl) return;
        fetch(this.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: `🚨 *[Backend Taller]* ${message}` }),
        }).catch(() => { /* silently ignore fetch errors */ });
    }

    static sendInfo(message: string): void {
        if (!this.webhookUrl) return;
        fetch(this.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: `ℹ️ *[Backend Taller]* ${message}` }),
        }).catch(() => { /* silently ignore fetch errors */ });
    }
}
