import { adjust, alias, parse } from 'cepheus'
import json from './model-one.json'

export const model = alias(adjust(parse(json), { lightness: { max: 1, min: 0 } }), (value) =>
  value === 'primary' ? 1 : (value as number),
)
