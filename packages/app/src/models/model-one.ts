import { adjust, alias, parse } from 'cepheus'
import 'uno.css'
import json from './model-one.json'

export const model = alias(
  adjust(parse(json), { lightness: [0.1, 1] }),
  (value) => (value === 'primary' ? 1 : (value as number))
)
