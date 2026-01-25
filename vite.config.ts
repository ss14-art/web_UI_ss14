import { defineConfig, type UserConfig, type ViteDevServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import { scanInterfaces } from './scripts/scan-interfaces.ts';

export default defineConfig(async (): Promise<UserConfig> => {
    const interfaces = scanInterfaces();

    const buildInputs: Record<string, string> = {
        main: resolve(process.cwd(), 'index.html'),
    };

    interfaces.forEach((iface) => {
        buildInputs[iface.name] = resolve(process.cwd(), `src/interfaces/${iface.name}/index.html`);
    });

    return {
        plugins: [
            svelte(),
            {
                name: 'show-routes',
                configureServer(server: ViteDevServer) {
                    server.middlewares.use((req, res, next) => {
                        if (req.url === '/api/interfaces') {
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ interfaces }));
                            return;
                        }
                        next();
                    });

                    const originalListen = server.listen.bind(server);
                    server.listen = function (...args: any[]) {
                        const result = originalListen(...args);

                        setTimeout(() => {
                            console.log('\n[NOVA SYSTEMS] INTERFACE MODULES:');
                            console.log('[*] MAIN: http://localhost:5173/');

                            interfaces.forEach((iface) => {
                                const status =
                                    iface.status === 'development' ? '[DEV]' :
                                        iface.status === 'deprecated' ? '[ERR]' : '[OK]';
                                const line = `${status} ${iface.title}: http://localhost:5173${iface.url}`;
                                console.log(line);
                            });

                            console.log('');
                        }, 100);

                        return result;
                    };
                },
            },
        ],
        base: './',
        build: {
            outDir: '../Resources/dist',
            emptyOutDir: true,
            target: 'chrome89',
            minify: 'terser',
            terserOptions: {
                compress: {
                    drop_console: true,
                    drop_debugger: true,
                    passes: 2,
                    dead_code: true,
                    conditionals: true,
                    evaluate: true,
                    booleans: true,
                    loops: true,
                    unused: true,
                    hoist_funs: true,
                    keep_fargs: false,
                    inline: true,
                    join_vars: true,
                    reduce_vars: true,
                    side_effects: true
                },
                mangle: {
                    properties: false
                },
                format: {
                    comments: false,
                    ascii_only: true
                }
            },
            rollupOptions: {
                input: buildInputs,
                output: {
                    entryFileNames: (chunkInfo) => {
                        if (chunkInfo.isEntry && chunkInfo.facadeModuleId?.endsWith('index.html')) {
                            return 'assets/[name]-[hash].js';
                        }
                        const name = chunkInfo.name ?? 'chunk';
                        return `src/interfaces/${name}/${name}.js`;
                    },
                    assetFileNames: (info) => {
                        const fileName = info.names?.[0] ?? 'asset';
                        if (fileName.endsWith('.css')) {
                            return `src/interfaces/${fileName.replace('.css', '')}/${fileName}`;
                        }
                        const chunkName = fileName.split('-')[0] || 'assets';
                        return `src/interfaces/${chunkName}/${chunkName}[extname]`;
                    },
                    manualChunks: undefined,
                    inlineDynamicImports: false,
                    compact: true
                },
                treeshake: {
                    moduleSideEffects: false,
                    propertyReadSideEffects: false,
                    annotations: true
                }
            },
            chunkSizeWarningLimit: 500,
            assetsInlineLimit: 4096,
            cssCodeSplit: false,
            sourcemap: false,
            reportCompressedSize: false
        },
        resolve: {
            alias: {
                '@': resolve(process.cwd(), './src'),
                '$lib': resolve(process.cwd(), './src/lib'),
            },
            dedupe: ['svelte']
        },
        optimizeDeps: {
            exclude: ['svelte'],
            include: ['clsx']
        },
        server: {
            port: 5173,
            strictPort: true,
            fs: {
                strict: true
            }
        },
        esbuild: {
            legalComments: 'none',
            treeShaking: true,
            minifyIdentifiers: true,
            minifySyntax: true,
            minifyWhitespace: true
        }
    };
});
