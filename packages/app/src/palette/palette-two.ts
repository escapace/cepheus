import { alias, parsePalette } from 'cepheus'
import json from './palette-two.json'

export default alias(parsePalette(json), (value) => (value === 'primary' ? 1 : (value as number)))
