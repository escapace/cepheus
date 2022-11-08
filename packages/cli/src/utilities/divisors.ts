const enumFromTo = (m: number) => (n: number) =>
  Array.from(
    {
      length: 1 + n - m
    },
    (_, i) => m + i
  )

export const divisors = (n: number) => {
  // The integer divisors of n, excluding n itself.
  const rRoot = Math.sqrt(n)
  const intRoot = Math.floor(rRoot)
  const blnPerfectSquare = rRoot === intRoot
  const lows = enumFromTo(1)(intRoot).filter((x) => n % x === 0)

  // For perfect squares, we can drop
  // the head of the 'highs' list
  return lows
    .concat(
      lows
        .map((x) => n / x)
        .reverse()
        .slice(blnPerfectSquare ? 1 : 0)
    )
    .slice(0, -1) // except n itself
}
