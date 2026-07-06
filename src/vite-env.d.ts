/// <reference types="svelte" />
/// <reference types="vite/client" />
/// <reference path="./global.d.ts" />

interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string
    readonly MODE: string
    readonly DEV: boolean
    readonly PROD: boolean
    readonly SSR: boolean
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}