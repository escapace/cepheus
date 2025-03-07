import { adjust, alias, parse } from 'cepheus'
import json from './model-two.json'

export const model = alias(adjust(parse(json), { lightness: { max: 1, min: 0.15 } }), (value) =>
  value === 'primary' ? 1 : (value as number),
)
