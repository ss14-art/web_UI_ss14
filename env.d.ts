/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string
    readonly MODE: string
    readonly DEV: boolean
    readonly PROD: boolean
    readonly SSR: boolean
    readonly BASE_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
    readonly url: string
    readonly hot?: {
        readonly data: any
        accept(): void
        accept(cb: (mod: any) => void): void
        accept(dep: string, cb: (mod: any) => void): void
        accept(deps: readonly string[], cb: (mods: any[]) => void): void
        dispose(cb: (data: any) => void): void
        decline(): void
        invalidate(): void
        on(event: string, cb: (...args: any[]) => void): void
    }
}