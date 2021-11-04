module.exports = {
  mode: 'jit',
  purge: {
    content: ['./src/**/*.{html,liquid}']
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
      'dracula',
      'garden'
    ],
    base: true,
    utils: true,
    logs: true,
    rtl: false,
  },
}
