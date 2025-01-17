import type { Font, Locales } from 'pangram'
import {
  arialBold,
  arialItalic,
  arialRegular,
  helveticaBold,
  helveticaRegular,
  helveticaOblique,
} from 'pangram'

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
  display: 'swap',
  name: 'roboto-flex',
  resourceHint: 'preload',
  source: './src/fonts/roboto-flex.ttf',
  tech: ['variations'],
  unicodeRange: enUnicodeRange,
  // prefer: [robotoMedium]
}

const robotoRegular: Font = {
  display: 'swap',
  name: 'roboto-regular',
  prefer: [robotoFlex],
  source: './src/fonts/roboto-regular.ttf',
  unicodeRange: enUnicodeRange,
}

const robotoBold: Font = {
  display: 'swap',
  name: 'roboto-bold',
  prefer: [robotoFlex],
  source: './src/fonts/roboto-bold.ttf',
  unicodeRange: enUnicodeRange,
}

const robotoItalic: Font = {
  display: 'swap',
  name: 'roboto-italic',
  prefer: [robotoFlex],
  source: './src/fonts/roboto-italic.ttf',
  unicodeRange: enUnicodeRange,
}

const locales: Locales = {
  en: {
    'sans-serif': {
      '@media': {
        'screen and (max-width: 900px)': {
          fontStretch: 50,
          fontVariationSettings: {
            wdth: 50,
          },
        },
      },
      'fontFamily': [robotoRegular, arialRegular, helveticaRegular],
    },
    'sans-serif-bold': {
      '@media': {
        'screen and (max-width: 900px)': {
          fontStretch: 50,
          fontVariationSettings: {
            wdth: 50,
            wght: 700,
          },
        },
      },
      'fontFamily': [robotoBold, arialBold, helveticaBold],
      'fontVariationSettings': {
        wght: 700,
      },
      'fontWeight': 700,
    },
    'sans-serif-italic': {
      'fontFamily': [robotoItalic, arialItalic, helveticaOblique],
      // fontStyle: 'italic',
      '@media': {
        'screen and (max-width: 900px)': {
          fontStretch: 50,
          fontVariationSettings: {
            slnt: -10,
            wdth: 50,
          },
        },
      },
      'fontVariationSettings': {
        slnt: -10,
      },
    },
    // 'sans-serif-medium': {
    //   fontFamily: [robotoMedium, 'system-ui']
    // }
  },
}

export default locales
