/**
 * Maps over an array using dynamically-sized slices, where each slice length is determined
 * by examining the current element and its position. Similar to Array.map() but operates
 * on variable-length chunks of the array instead of individual elements.
 *
 * @typeParam T - The type of elements in the input array
 * @typeParam R - The type of elements in the returned array
 *
 * @param array - The input array to process
 * @param getSliceLength - Function that determines the length of the next slice.
 *                        Receives the current element and its index, returns the number
 *                        of elements to include in this slice. Minimum slice length is 1.
 * @param processor - Function that processes each slice and returns a transformed value.
 *                   Receives the slice array and the starting index of the slice.
 *
 * @returns Array of processed results, where each element is the result of calling
 *          the processor function on a dynamically-sized slice.
 */
export function mapSlice<T, R>(
  array: T[],
  getSliceLength: (currentValue: T, index: number) => number,
  processor: (slice: T[], startIndex: number) => R,
): R[] {
  const results: R[] = []
  let index = 0

  while (index < array.length) {
    const currentValue = array[index]
    const sliceLength = Math.max(1, getSliceLength(currentValue, index))

    const remainingLength = array.length - index
    const actualSliceSize = Math.min(sliceLength, remainingLength)
    const slice = array.slice(index, index + actualSliceSize)

    const result = processor(slice, index)
    results.push(result)

    index += actualSliceSize
  }

  return results
}
