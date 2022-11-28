export const chunk = <T>(array: T[], n = 3) =>
  array.reduce<T[][]>((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / n)

    if (resultArray[chunkIndex] === undefined) {
      resultArray[chunkIndex] = [] // start a new chunk
    }

    resultArray[chunkIndex].push(item)

    return resultArray
  }, [])
