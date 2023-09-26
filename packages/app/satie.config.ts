import type { Font, Locales } from '@escapace/satie'
import { arialBold, arialItalic, arialRegular, helveticaBold, helveticaRegular, helveticaOblique } from '@escapace/satie'

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
  source: './src/fonts/roboto-flex.ttf',
  tech: ['variations'],
  unicodeRange: enUnicodeRange,
  display: 'swap',
  resourceHint: 'preload'
  // prefer: [robotoMedium]
}

const robotoRegular: Font = {
  name: 'roboto-regular',
  source: './src/fonts/roboto-regular.ttf',
  unicodeRange: enUnicodeRange,
  prefer: [robotoFlex],
  display: 'swap'
}

const robotoBold: Font = {
  name: 'roboto-bold',
  source: './src/fonts/roboto-bold.ttf',
  unicodeRange: enUnicodeRange,
  prefer: [robotoFlex],
  display: 'swap'
}

const robotoItalic: Font = {
  name: 'roboto-italic',
  source: './src/fonts/roboto-italic.ttf',
  unicodeRange: enUnicodeRange,
  prefer: [robotoFlex],
  display: 'swap'
}

const locales: Locales = {
  en: {
    'sans-serif': {
      fontFamily: [
        robotoRegular,
        arialRegular,
        helveticaRegular
      ],
      '@media': {
        'screen and (max-width: 900px)': {
          fontStretch: 50,
          fontVariationSettings: {
            wdth: 50
          }
        }
      }
    },
    'sans-serif-bold': {
      fontFamily: [
        robotoBold,
        arialBold,
        helveticaBold,
      ],
      fontWeight: 700,
      fontVariationSettings: {
        wght: 700
      },
      '@media': {
        'screen and (max-width: 900px)': {
          fontStretch: 50,
          fontVariationSettings: {
            wdth: 50,
            wght: 700
          }
        }
      }
    },
    'sans-serif-italic': {
      fontFamily: [
        robotoItalic,
        arialItalic,
        helveticaOblique
      ],
      // fontStyle: 'italic',
      fontVariationSettings: {
        slnt: -10
      },
      '@media': {
        'screen and (max-width: 900px)': {
          fontStretch: 50,
          fontVariationSettings: {
            wdth: 50,
            slnt: -10
          }
        }
      }
    }
    // 'sans-serif-medium': {
    //   fontFamily: [robotoMedium, 'system-ui']
    // }
  }
}

export default locales
