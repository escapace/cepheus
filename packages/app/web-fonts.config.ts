import type { Font, Locales } from '@escapace/web-fonts'

const enUnicodeRange =
  'U+20-7E,U+A0-BF,U+2BB,U+2BC,U+2C6,U+2DA,U+2DC,U+303,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'

// const robotoMedium: Font = {
//   name: 'roboto-medium',
//   family: 'Roboto',
//   source: './src/fonts/roboto-medium.ttf',
//   style: 'normal',
//   weight: 500,
//   unicodeRange: enUnicodeRange,
//   // prefer: [robotoFlex]
// }

const robotoFlex: Font = {
  name: 'roboto-flex',
  family: 'Roboto Flex',
  source: './src/fonts/roboto-flex.ttf',
  tech: ['variations'],
  unicodeRange: enUnicodeRange
  // prefer: [robotoMedium]
}

const robotoRegular: Font = {
  name: 'roboto-regular',
  family: 'Roboto',
  source: './src/fonts/roboto-regular.ttf',
  style: 'normal',
  weight: 400,
  unicodeRange: enUnicodeRange,
  prefer: [robotoFlex]
}

const robotoBold: Font = {
  name: 'roboto-bold',
  family: 'Roboto',
  source: './src/fonts/roboto-bold.ttf',
  style: 'normal',
  weight: 700,
  unicodeRange: enUnicodeRange,
  prefer: [robotoFlex]
}

const locales: Locales = {
  en: {
    'sans-serif': {
      fontFamily: [robotoRegular, 'system-ui']
    },
    'sans-serif-bold': {
      fontFamily: [robotoBold, 'system-ui']
    },
    // 'sans-serif-medium': {
    //   fontFamily: [robotoMedium, 'system-ui']
    // }
  }
}

export default locales
