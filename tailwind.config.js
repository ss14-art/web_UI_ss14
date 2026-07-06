export default {
    content: ["./src/**/*.{html,js,svelte,ts}"],
    theme: {
        extend: {
            colors: {
                background: '#000000',
                surface: '#0a0a0a',
                'surface-hover': '#141414',
                border: '#2a2a2a',
                'border-light': '#3a3a3a',
                'border-heavy': '#4a4a4a',
                'text-primary': '#b8b8b8',
                'text-secondary': '#686868',
                'text-dim': '#484848',
                accent: '#4a9d4a',
                'accent-dim': '#2a6d2a',
                warning: '#9d7a4a',
                danger: '#9d4a4a',
                info: '#4a7a9d'
            },
            fontFamily: {
                terminal: ['Terminal', 'Courier New', 'monospace']
            },
            fontSize: {
                'terminal-xs': '9px',
                'terminal-sm': '10px',
                'terminal': '11px',
                'terminal-lg': '12px'
            },
            borderRadius: {
                none: '0px'
            },
            animation: {
                'scan': 'scan 8s linear infinite',
                'blink': 'blink 1s step-end infinite',
                'pulse': 'pulse 2s ease-in-out infinite'
            },
            keyframes: {
                scan: {
                    '0%': { transform: 'translateY(0)' },
                    '100%': { transform: 'translateY(8px)' }
                },
                blink: {
                    '0%, 50%': { opacity: '1' },
                    '51%, 100%': { opacity: '0' }
                },
                pulse: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.6' }
                }
            }
        }
    }
};