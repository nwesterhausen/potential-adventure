module.exports = {
  mode: 'jit',
  purge: {
    content: ['./src/**/*.html']
  },
  //darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {},
  plugins: [
    require('@tailwindcss/typography'),
    require('daisyui'),
  ],
  // config (optional)
  daisyui: {
    styled: true,
    themes: [
      'dark',
      'emerald'
    ],
    base: true,
    utils: true,
    logs: true,
    rtl: false,
  },
}
