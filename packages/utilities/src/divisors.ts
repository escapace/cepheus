/**
 * Finds all positive whole number divisors of the input number, excluding the number itself.
 * @param num - The number to find divisors for
 * @returns Array of divisors in ascending order, or empty array for invalid input
 */
export function divisors(number_: number): number[] {
  // Handle edge cases
  if (!Number.isInteger(number_) || number_ <= 0) {
    return []
  }

  if (number_ === 1) {
    return []
  }

  const array: number[] = []

  // Check all numbers from 1 to sqrt(num)
  for (let index = 1; index * index <= number_; index++) {
    if (number_ % index === 0) {
      array.push(index)

      // Add the corresponding divisor (num/i) if it's different from i
      // and not equal to num itself
      const complement = number_ / index
      if (complement !== index && complement !== number_) {
        array.push(complement)
      }
    }
  }

  // Sort in ascending order
  return array.sort((a, b) => a - b)
}
