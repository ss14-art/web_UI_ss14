declare global {
    interface Window {
        fs: {
            readFile(path: string, options?: { encoding?: string }): Promise<Uint8Array | string>
        }
    }
}

export {}