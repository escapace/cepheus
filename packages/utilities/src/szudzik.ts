import { szudzik as szudzik2 } from 'cepheus'

export { szudzik2 }

export const unszudzik2 = (z: number): [number, number] => {
  const sqrtz = Math.floor(Math.sqrt(z))
  const sqz = sqrtz * sqrtz
  return z - sqz >= sqrtz ? [sqrtz, z - sqz - sqrtz] : [z - sqz, sqrtz]
}

export const szudzik = (...number: number[]) =>
  number.reduce((previous, next) => szudzik2(previous, next))

export const unszudzik = (number: number, n: number) => {
  let value: number[] = []

  let index = n

  while (index > 1) {
    value = [...unszudzik2(value[0] ?? number), ...value.slice(1)]
    index--
  }

  return value
}
