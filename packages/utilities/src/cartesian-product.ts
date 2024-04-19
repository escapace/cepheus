export const cartesianProduct = <T>(...sets: T[][]) =>
  sets.reduce<T[][]>(
    (accumulatorSets, set) =>
      accumulatorSets.flatMap((accumulatorSet) =>
        set.map((value) => [...accumulatorSet, value])
      ),
    [[]]
  )
