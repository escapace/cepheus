/* eslint-disable typescript/prefer-for-of */
/* eslint-disable typescript/no-explicit-any */
/* eslint-disable typescript/no-unsafe-assignment */

export function permutations<O extends Record<number | string, any[]>>(object: O) {
  let combos: Array<{ [k in keyof O]: O[k][number] }> = []

  for (const key in object) {
    const values = object[key]
    const all = []
    for (let index = 0; index < values.length; index++) {
      for (let index_ = 0; index_ < (combos.length === 0 ? 1 : combos.length); index_++) {
        const newCombo = { ...combos[index_], [key]: values[index] }
        all.push(newCombo)
      }
    }
    combos = all
  }

  return combos
}
