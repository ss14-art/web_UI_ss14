type NovaHandler = (data: any) => void;

interface NovaEvent {
    detail: {
        requestId?: string;
        data: string;
    };
}

class NovaBridge {
    private static instance: NovaBridge;
    private pendingRequests = new Map<string, {
        resolve: (value: any) => void,
        reject: (reason?: string) => void,
    }>();

    public static getInstance(): NovaBridge {
        if (!NovaBridge.instance) {
            NovaBridge.instance = new NovaBridge();
        }
        return NovaBridge.instance;
    }

    private isPageReady = false;
    private eventQueue: Array<{ type: string; data: any }> = [];

    private chunkBuffers = new Map<string, {
        chunks: string[];
        total: number;
        received: number;
        eventType: string;
    }>();

    private responseChunkBuffers = new Map<string, {
        chunks: string[];
        total: number;
        received: number;
        requestId: string;
    }>();

    private constructor() {
        this.initEventListeners();
        this.initPageReadyHandler();
        this.initChunkHandlers();
    }

    public invoke(eventType: string, data: any = {}): Promise<any> {
        return new Promise((resolve, reject) => {
            const requestId = this.generateRequestId();
            this.pendingRequests.set(requestId, { resolve, reject });

            const jsonData = JSON.stringify(data);
            const encodedData = this.safeBtoa(jsonData);

            if (encodedData.length > 1500) {
                this.sendChunkedRequest(eventType, requestId, jsonData);
            } else {
                const url = this.buildProtocolUrl(eventType, requestId, encodedData);
                this.sendRequest(url);
            }

            setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject('Request timeout');
                }
            }, 10000);
        });
    }

    public emit(eventType: string, data: any = {}): void {
        if (!this.isPageReady) {
            this.eventQueue.push({ type: eventType, data });
            return;
        }

        const event = new CustomEvent(`nova:${eventType}`, {
            detail: { data: this.safeBtoa(JSON.stringify(data)) },
        });
        window.dispatchEvent(event);
    }

    public subscribe(eventType: string, handler: NovaHandler): () => void {
        const listener = (e: Event) => {
            const novaEvent = e as unknown as NovaEvent;
            const encodedData = novaEvent.detail.data;

            try {
                const decodedData = this.safeAtob(encodedData);
                const parsedData = JSON.parse(decodedData);
                handler(parsedData);
            } catch {
                handler(encodedData);
            }
        };

        window.addEventListener(`nova:${eventType}`, listener);
        return () => window.removeEventListener(`nova:${eventType}`, listener);
    }

    private initEventListeners() {
        window.addEventListener('nova:complete', (e: Event) => {
            const novaEvent = e as unknown as NovaEvent;
            const { requestId, data } = novaEvent.detail;
            if (requestId) {
                this.handleComplete(requestId, data);
            }
        });

        window.addEventListener('nova:error', (e: Event) => {
            const novaEvent = e as unknown as NovaEvent;
            const { requestId, data } = novaEvent.detail;
            if (requestId) {
                this.handleError(requestId, data);
            }
        });
    }

    private initChunkHandlers() {
        window.addEventListener('nova:chunk-event', (e: Event) => {
            this.handleChunkEvent(e as unknown as NovaEvent);
        });

        window.addEventListener('nova:response-chunk-init', (e: Event) => {
            this.handleResponseChunkInit(e as unknown as NovaEvent);
        });

        window.addEventListener('nova:response-chunk-data', (e: Event) => {
            this.handleResponseChunkData(e as unknown as NovaEvent);
        });
    }

    private initPageReadyHandler() {
        const onReady = () => {
            this.sendPageReady();
            window.removeEventListener('DOMContentLoaded', onReady);
        };

        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', onReady);
        } else {
            this.sendPageReady();
        }
    }

    private sendPageReady() {
        this.isPageReady = true;

        const widthMeta = document.querySelector('meta[name="nova-window-width"]');
        const heightMeta = document.querySelector('meta[name="nova-window-height"]');

        const pageReadyData: any = {};
        if (widthMeta && heightMeta) {
            pageReadyData.initialWidth = parseInt(widthMeta.getAttribute('content') || '800');
            pageReadyData.initialHeight = parseInt(heightMeta.getAttribute('content') || '600');
        }

        this.invoke('page-ready', pageReadyData).catch(() => {});

        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            if (event) {
                this.emit(event.type, event.data);
            }
        }
    }

    private sendChunkedRequest(eventType: string, requestId: string, data: string) {
        const chunkId = this.generateChunkId();
        const encodedData = this.safeBtoa(data);
        const chunks = this.splitIntoChunks(encodedData, 1500);

        chunks.forEach((chunk, index) => {
            setTimeout(() => {
                const chunkData = {
                    chunkId,
                    index,
                    total: chunks.length,
                    data: chunk,
                    originalEventType: eventType,
                    originalRequestId: requestId,
                };

                const chunkUrl = this.buildProtocolUrl('chunk-data', requestId, this.safeBtoa(JSON.stringify(chunkData)));
                this.sendRequest(chunkUrl);
            }, index * 10);
        });
    }

    private handleChunkEvent(event: NovaEvent) {
        try {
            const decodedData = this.safeAtob(event.detail.data);
            const parsedData = JSON.parse(decodedData);
            const { chunkId, index, total, data: chunkData, eventType } = parsedData;

            if (!this.chunkBuffers.has(chunkId)) {
                this.chunkBuffers.set(chunkId, {
                    chunks: new Array(total),
                    total,
                    received: 0,
                    eventType,
                });
            }

            const buffer = this.chunkBuffers.get(chunkId)!;
            buffer.chunks[index] = chunkData;
            buffer.received++;

            if (buffer.received === buffer.total) {
                const completeData = buffer.chunks.join('');
                this.chunkBuffers.delete(chunkId);

                const evt = new CustomEvent(`nova:${buffer.eventType}`, {
                    detail: { data: completeData },
                });
                window.dispatchEvent(evt);
            }
        } catch {}
    }

    private handleResponseChunkInit(event: NovaEvent) {
        try {
            const decodedData = this.safeAtob(event.detail.data);
            const parsedData = JSON.parse(decodedData);
            const { chunkId, requestId, total } = parsedData;

            this.responseChunkBuffers.set(chunkId, {
                chunks: new Array(total),
                total,
                received: 0,
                requestId,
            });
        } catch {}
    }

    private handleResponseChunkData(event: NovaEvent) {
        try {
            const decodedData = this.safeAtob(event.detail.data);
            const parsedData = JSON.parse(decodedData);
            const { chunkId, index, data: chunkData } = parsedData;

            const buffer = this.responseChunkBuffers.get(chunkId);
            if (!buffer) return;

            buffer.chunks[index] = chunkData;
            buffer.received++;

            if (buffer.received === buffer.total) {
                const completeData = buffer.chunks.join('');
                this.responseChunkBuffers.delete(chunkId);
                this.handleComplete(buffer.requestId, completeData);
            }
        } catch {}
    }

    private generateRequestId(): string {
        return `r${Date.now()}${Math.random().toString(36).slice(2, 11)}`;
    }

    private generateChunkId(): string {
        return `c${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
    }

    private splitIntoChunks(data: string, chunkSize: number): string[] {
        const chunks: string[] = [];
        for (let i = 0; i < data.length; i += chunkSize) {
            chunks.push(data.substring(i, i + chunkSize));
        }
        return chunks;
    }

    private buildProtocolUrl(eventType: string, requestId: string, data: string): string {
        return `http://webui.local/__bridge__/${eventType}?requestId=${encodeURIComponent(requestId)}&data=${encodeURIComponent(data)}`;
    }

    private sendRequest(url: string): void {
        // NOTE: deliberately NOT using a hidden <iframe> to deliver bridge
        // requests. Creating/destroying sub-frames disrupts CEF's off-screen
        // paint compositor (OnPaint stops firing for the main frame, the
        // control freezes to a blank frame) until the control is resized.
        // fetch() on the same http://webui.local/ origin reaches the native
        // request handler without spawning a frame, so the control keeps
        // painting. The actual bridge response arrives via the `nova:complete`
        // / `nova:error` CustomEvents dispatched by the host through
        // ExecuteJavaScript, so the fetch result itself is ignored.
        void fetch(url, { method: 'GET', keepalive: true }).catch(() => {});
    }

    private handleComplete(requestId: string, data: string): void {
        const request = this.pendingRequests.get(requestId);
        if (request) {
            try {
                const decodedData = this.safeAtob(data);
                const parsedData = JSON.parse(decodedData);
                request.resolve(parsedData);
            } catch {
                request.resolve(data);
            }
            this.pendingRequests.delete(requestId);
        }
    }

    private handleError(requestId: string, message: string): void {
        const request = this.pendingRequests.get(requestId);
        if (request) {
            request.reject(message);
            this.pendingRequests.delete(requestId);
        }
    }

    private safeBtoa(str: string): string {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
            (_, p1) => String.fromCharCode(parseInt(p1, 16)),
        ));
    }

    private safeAtob(str: string): string {
        return decodeURIComponent([...atob(str)]
            .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
            .join(''),
        );
    }
}

export const novaBridge = NovaBridge.getInstance();
