/* eslint-disable typescript/strict-boolean-expressions */
/* eslint-disable typescript/no-unsafe-assignment */
/**
 * Create a Vitest benchmark comparing three data access implementations.
 *
 * Requirements:
 * 1. Implement three data structures with identical get() method signatures
 * 2. All must be initialized with: new DataStructure([number, DataValue][]), arrayLength)
 * 3. All must implement: get(key: number): DataValue | undefined
 *
 * Implementation Constraints:
 *
 * **Map (baseline):**
 * - Use JavaScript's native Map directly
 *
 * **ArrayDataStructure:**
 * - Use direct array indexing without any complex storage optimization
 * - Store data in immediately consumable format
 *
 * **ArrayBufferDataStructure:**
 * - MUST use ArrayBuffer/TypedArray for storage (Float32Array recommended)
 * - CONSTRAINT: All numbers in tuples are guaranteed to be positive
 * - CONSTRAINT: arrayLength parameter is known at construction and fixed
 * - CONSTRAINT: Keys are sequential integers starting from 0, however they might have gaps
 * - Use these constraints for optimization
 * - Implement direct indexing without Map lookup for key-to-data mapping
 * - Must reconstruct DataValue arrays in get() method from binary storage
 *
 * Benchmark Requirements:
 * - Test with different dataset sizes (100, 1K, 10K, 50K keys)
 * - Test with different array lengths (5, 50 elements per array)
 * - Each benchmark should perform 1000 get() operations
 * - Mix 50% existing keys with 50% non-existing keys to simulate realistic access patterns
 * - Generate test data with ~20% undefined elements and ~80% random positive number tuples
 *
 * Data Generation:
 * - Keys: sequential integers 0, 3, 5, ..., numKeys-1
 * - Values: arrays of fixed length containing either [x,y,z] tuples or undefined
 * - All numbers in tuples must be positive (leveraged by ArrayBufferDataStructure)
 */

import { bench, describe } from 'vitest'

type DataEntry = [number, DataValue]
type DataValue = Array<Triple | undefined>
type Triple = [number, number, number]

class ArrayDataStructure {
  private readonly valueArrays: Array<DataValue | undefined>
  constructor(entries: DataEntry[], _arrayLength: number) {
    const highestKey = Math.max(...entries.map(([key]) => key))
    this.valueArrays = new Array(highestKey + 1)
    for (const [key, valueArray] of entries) this.valueArrays[key] = valueArray
  }
  get(key: number): DataValue | undefined {
    return this.valueArrays[key]
  }
}

class PackedArrayDataStructure {
  private readonly valueArrays: Array<DataValue | undefined>
  constructor(entries: DataEntry[], arrayLength: number) {
    const highestKey = Math.max(...entries.map(([key]) => key))
    const store = new Array(highestKey + 1).fill(undefined)
    for (const [key, sourceRow] of entries) {
      const packedRow: DataValue = new Array(arrayLength).fill(undefined)
      for (let index = 0; index < arrayLength; index += 1) packedRow[index] = sourceRow[index]
      Object.freeze(packedRow)
      store[key] = packedRow
    }
    this.valueArrays = store
  }
  get(key: number): DataValue | undefined {
    return this.valueArrays[key]
  }
}

// class PackedArrayDataStructure {
//   private readonly valueArrays: (DataValue | undefined)[]
//
//   constructor(entries: DataEntry[], _arrayLength: number) {
//     // 1. Find the highest key so we know exactly how large the table must be.
//     // let maxKey = -1
//     // for (const [key] of entries) if (key > maxKey) maxKey = key
//     const maxKey = Math.max(...entries.map(([key]) => key));
//
//     // 2. Allocate a fully packed array and pre-fill every slot with `undefined`.
//     const store: (DataValue | undefined)[] = new Array(maxKey + 1).fill(undefined)
//
//     // 3. Insert rows, freezing each one on the way in to guarantee immutability.
//     for (const [key, row] of entries) {
//       Object.freeze(row)
//       store[key] = row
//     }
//
//     this.valueArrays = store
//   }
//
//   get(key: number): DataValue | undefined {
//     // Direct indexing; keys outside 0‥maxKey naturally return `undefined`.
//     return this.valueArrays[key]
//   }
// }

class ArrayBufferDataStructure {
  private readonly definedFlags: Uint8Array
  private readonly highestKey: number
  private readonly itemsPerKey: number
  private readonly keyPresence: Uint8Array
  private readonly xColumn: Float32Array
  private readonly yColumn: Float32Array
  private readonly zColumn: Float32Array

  constructor(entries: DataEntry[], arrayLength: number) {
    this.itemsPerKey = arrayLength
    this.highestKey = Math.max(...entries.map(([key]) => key))
    const totalItems = (this.highestKey + 1) * arrayLength
    this.xColumn = new Float32Array(totalItems)
    this.yColumn = new Float32Array(totalItems)
    this.zColumn = new Float32Array(totalItems)
    this.definedFlags = new Uint8Array(totalItems)
    this.keyPresence = new Uint8Array(this.highestKey + 1)

    for (const [key, row] of entries) {
      this.keyPresence[key] = 1
      const base = key * arrayLength
      for (let index = 0; index < arrayLength; index += 1) {
        const v = row[index]
        if (v !== undefined) {
          const index_ = base + index
          this.definedFlags[index_] = 1
          this.xColumn[index_] = v[0]
          this.yColumn[index_] = v[1]
          this.zColumn[index_] = v[2]
        }
      }
    }
  }

  get(key: number): DataValue | undefined {
    if (key < 0 || key > this.highestKey || !this.keyPresence[key]) return undefined
    const base = key * this.itemsPerKey
    const out: DataValue = new Array(this.itemsPerKey)
    for (let index = 0; index < this.itemsPerKey; index += 1) {
      const index_ = base + index
      out[index] =
        this.definedFlags[index_] === 0
          ? undefined
          : [this.xColumn[index_], this.yColumn[index_], this.zColumn[index_]]
    }
    return out
  }
}

function generateTestData(totalKeys: number, arrayLength: number): DataEntry[] {
  const entries: DataEntry[] = []
  let nextKey = 0
  for (let produced = 0; produced < totalKeys; produced += 1) {
    const row: DataValue = new Array(arrayLength).fill(undefined)
    for (let index = 0; index < arrayLength; index += 1) {
      if (Math.random() >= 0.2) {
        row[index] = [Math.random() * 999 + 1, Math.random() * 999 + 1, Math.random() * 999 + 1]
      }
    }
    entries.push([nextKey, row])
    nextKey += 1 + ((Math.random() * 3) | 0)
  }
  return entries
}

function createBenchmarkSuite(totalKeys: number, arrayLength: number) {
  describe(`Benchmark • keys=${totalKeys} • len=${arrayLength}`, () => {
    const dataEntries = generateTestData(totalKeys, arrayLength)

    const mapDS = new Map<number, DataValue>(dataEntries)
    const arrayDS = new ArrayDataStructure(dataEntries, arrayLength)
    const packedDS = new PackedArrayDataStructure(dataEntries, arrayLength)
    const arrayBufferDS = new ArrayBufferDataStructure(dataEntries, arrayLength)

    const presentKeys = dataEntries.map(([k]) => k)
    const maxKey = Math.max(...presentKeys)
    const lookupKeys: number[] = new Array(1000)
    for (let index = 0; index < 1000; index += 1) {
      lookupKeys[index] =
        index & 1
          ? maxKey + 1 + ((Math.random() * maxKey) | 0)
          : presentKeys[(Math.random() * presentKeys.length) | 0]
    }

    bench('Map.get()', () => {
      for (const k of lookupKeys) mapDS.get(k)
    })
    bench('ArrayDataStructure.get()', () => {
      for (const k of lookupKeys) arrayDS.get(k)
    })
    bench('PackedArrayDataStructure.get()', () => {
      for (const k of lookupKeys) packedDS.get(k)
    })
    bench('ArrayBufferDataStructure.get()', () => {
      for (const k of lookupKeys) arrayBufferDS.get(k)
    })
  })
}

;[100, 1000, 10_000, 50_000].forEach((keys) =>
  [5, 50].forEach((length) => createBenchmarkSuite(keys, length)),
)
