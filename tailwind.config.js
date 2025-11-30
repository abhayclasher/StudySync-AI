/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: [
		"./index.html",
		"./**/*.{js,ts,jsx,tsx}",
		"./components/**/*.{js,ts,jsx,tsx}",
		"!./node_modules/**/*", // Exclude node_modules for better performance
	],
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: '#3b82f6',
					foreground: '#ffffff',
				},
				secondary: {
					DEFAULT: '#60a5fa',
					foreground: '#ffffff',
				},
				accent: {
					DEFAULT: '#2563eb',
					foreground: '#ffffff',
				},
				dark: '#0a0a0a',
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
			},
			screens: {
				sm: '640px',
				md: '768px',
				lg: '1024px',
				xl: '1280px',
				'2xl': '1536px'
			},
			spacing: {
				'18': '4.5rem',
				'88': '22rem',
				'128': '32rem'
			},
			maxWidth: {
				'8xl': '88rem',
				'9xl': '96rem'
			},
			fontSize: {
				xs: [
					'0.75rem',
					{
						lineHeight: '1rem'
					}
				],
				sm: [
					'0.875rem',
					{
						lineHeight: '1.25rem'
					}
				],
				base: [
					'1rem',
					{
						lineHeight: '1.5rem'
					}
				],
				lg: [
					'1.125rem',
					{
						lineHeight: '1.75rem'
					}
				],
				xl: [
					'1.25rem',
					{
						lineHeight: '1.75rem'
					}
				],
				'2xl': [
					'1.5rem',
					{
						lineHeight: '2rem'
					}
				],
				'3xl': [
					'1.875rem',
					{
						lineHeight: '2.25rem'
					}
				],
				'4xl': [
					'2.25rem',
					{
						lineHeight: '2.5rem'
					}
				],
				'5xl': [
					'3rem',
					{
						lineHeight: '1'
					}
				],
				'6xl': [
					'3.75rem',
					{
						lineHeight: '1'
					}
				],
				'7xl': [
					'4.5rem',
					{
						lineHeight: '1'
					}
				],
				'8xl': [
					'6rem',
					{
						lineHeight: '1'
					}
				],
				'9xl': [
					'8rem',
					{
						lineHeight: '1'
					}
				]
			},
			animation: {
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
			}
		},
		keyframes: {
			typing: {
				'0%, 100%': {
					transform: 'translateY(0)',
					opacity: '0.5'
				},
				'50%': {
					transform: 'translateY(-2px)',
					opacity: '1'
				}
			},
			'loading-dots': {
				'0%, 100%': {
					opacity: '0'
				},
				'50%': {
					opacity: '1'
				}
			},
			wave: {
				'0%, 100%': {
					transform: 'scaleY(1)'
				},
				'50%': {
					transform: 'scaleY(0.6)'
				}
			},
			blink: {
				'0%, 100%': {
					opacity: '1'
				},
				'50%': {
					opacity: '0'
				}
			}
		},
		'text-blink': {
			'0%, 100%': {
				color: 'var(--primary)'
			},
			'50%': {
				color: 'var(--muted-foreground)'
			}
		},
		'bounce-dots': {
			'0%, 100%': {
				transform: 'scale(0.8)',
				opacity: '0.5'
			},
			'50%': {
				transform: 'scale(1.2)',
				opacity: '1'
			}
		},
		'thin-pulse': {
			'0%, 100%': {
				transform: 'scale(0.95)',
				opacity: '0.8'
			},
			'50%': {
				transform: 'scale(1.05)',
				opacity: '0.4'
			}
		},
		'pulse-dot': {
			'0%, 100%': {
				transform: 'scale(1)',
				opacity: '0.8'
			},
			'50%': {
				transform: 'scale(1.5)',
				opacity: '1'
			}
		},
		'shimmer-text': {
			'0%': {
				backgroundPosition: '150% center'
			},
			'100%': {
				backgroundPosition: '-150% center'
			}
		},
		'wave-bars': {
			'0%, 100%': {
				transform: 'scaleY(1)',
				opacity: '0.5'
			},
			'50%': {
				transform: 'scaleY(0.6)',
				opacity: '1'
			}
		},
		shimmer: {
			'0%': {
				backgroundPosition: '200% 50%'
			},
			'100%': {
				backgroundPosition: '-200% 50%'
			}
		},
		'spinner-fade': {
			'0%': {
				opacity: '0'
			},
			'100%': {
				opacity: '1'
			}
		}
	},
	plugins: [],
}