import { adjustPalette, alias, parsePalette } from 'cepheus'
import json from './palette-two.json'

export default alias(
  adjustPalette(parsePalette(json), { lightness: { max: 1, min: 0.15 } }),
  (value) => (value === 'primary' ? 1 : (value as number)),
)
