const szudzikPair = (x: number, y: number): number =>
  x >= y ? x * x + x + y : y * y + x

const szudzikUnpair = (z: number): [number, number] => {
  const sqrtz = Math.floor(Math.sqrt(z))
  const sqz = sqrtz * sqrtz
  return z - sqz >= sqrtz ? [sqrtz, z - sqz - sqrtz] : [z - sqz, sqrtz]
}

export const szudzik = (...number: number[]) =>
  number.reduce((prev, next) => szudzikPair(prev, next))

export const unszudzik = (number: number, n: number) => {
  let value: number[] = []

  let index = n

  while (index > 1) {
    value = [...szudzikUnpair(value[0] ?? number), ...value.slice(1)]
    index--
  }

  return value
}
