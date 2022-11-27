const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

export const normalize = (values: number[]) => {
  const s = sum(values)

  return values.map((value) => value / s)
}
