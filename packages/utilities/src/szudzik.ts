export const szudzik2 = (x: number, y: number): number =>
  x >= y ? x * x + x + y : y * y + x

export const unszudzik2 = (z: number): [number, number] => {
  const sqrtz = Math.floor(Math.sqrt(z))
  const sqz = sqrtz * sqrtz
  return z - sqz >= sqrtz ? [sqrtz, z - sqz - sqrtz] : [z - sqz, sqrtz]
}

export const szudzik = (...number: number[]) =>
  number.reduce((prev, next) => szudzik2(prev, next))

export const unszudzik = (number: number, n: number) => {
  let value: number[] = []

  let index = n

  while (index > 1) {
    value = [...unszudzik2(value[0] ?? number), ...value.slice(1)]
    index--
  }

  return value
}
