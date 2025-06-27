export class ArrayMap<T> {
  private readonly valueArrays: Array<T | undefined>
  constructor(keys: number[], values: T[]) {
    const highestKey = Math.max(...keys)
    this.valueArrays = new Array<T | undefined>(highestKey + 1).fill(undefined)

    for (let index = 0; index < keys.length; index++) {
      const key = keys[index]
      const value = values[index]

      this.valueArrays[key] = value
    }
  }
  get(key: number): T | undefined {
    return this.valueArrays[key]
  }
}
