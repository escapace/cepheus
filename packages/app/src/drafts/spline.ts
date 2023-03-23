function add(o: number[], a: number[], b: number[]) {
  // o = o || []
  o[0] = a[0] + b[0]
  o[1] = a[1] + b[1]
  o[2] = a[2] + b[2]
  return o
}

function sub(o: number[], a: number[], b: number[]) {
  // o = o || []
  o[0] = a[0] - b[0]
  o[1] = a[1] - b[1]
  o[2] = a[2] - b[2]
  return o
}

function distSq(a: number[], b: number[]) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const dz = b[2] - a[2]
  return dx * dx + dy * dy + dz * dz
}

function dist(a: number[], b: number[]) {
  return Math.sqrt(distSq(a, b))
}

export function CubicPoly() {
  let c0 = 0
  let c1 = 0
  let c2 = 0
  let c3 = 0

  /*
   * Compute coefficients for a cubic polynomial
   *   p(s) = c0 + c1*s + c2*s^2 + c3*s^3
   * such that
   *   p(0) = x0, p(1) = x1
   *  and
   *   p'(0) = t0, p'(1) = t1.
   */
  function init(x0: number, x1: number, t0: number, t1: number) {
    c0 = x0
    c1 = t0
    c2 = -3 * x0 + 3 * x1 - 2 * t0 - t1
    c3 = 2 * x0 - 2 * x1 + t0 + t1
  }

  return {
    initCatmullRom: function (
      x0: number,
      x1: number,
      x2: number,
      x3: number,
      tension: number
    ) {
      init(x1, x2, tension * (x2 - x0), tension * (x3 - x1))
    },

    initNonuniformCatmullRom: function (
      x0: number,
      x1: number,
      x2: number,
      x3: number,
      dt0: number,
      dt1: number,
      dt2: number
    ) {
      // compute tangents when parameterized in [t1,t2]
      let t1 = (x1 - x0) / dt0 - (x2 - x0) / (dt0 + dt1) + (x2 - x1) / dt1
      let t2 = (x2 - x1) / dt1 - (x3 - x1) / (dt1 + dt2) + (x3 - x2) / dt2

      // rescale tangents for parametrization in [0,1]
      t1 *= dt1
      t2 *= dt1

      init(x1, x2, t1, t2)
    },

    calc: function (t: number) {
      const t2 = t * t
      const t3 = t2 * t
      return c0 + c1 * t + c2 * t2 + c3 * t3
    }
  }
}

interface Options {
  points: number[][]
  closed: boolean
  type: 'uniform' | 'centripetal' | 'chordal' | 'catmullrom'
  tension: number
}

// Extracted from ThreeJS, modified to plain arrays

/*
  Based on an optimized c++ solution in
   - http://stackoverflow.com/questions/9489736/catmull-rom-curve-with-no-cusps-and-no-self-intersections/
   - http://ideone.com/NoEbVM
  This CubicPoly class could be used for reusing some variables and calculations,
  but for three.js curve use, it could be possible inlined and flatten into a single function call
  which can be placed in CurveUtils.
  */

export function getCatmullRomPoint(
  opts: Options,
  t: number,
  out: number[] = []
) {
  const tmp1: number[] = []
  const tmp2: number[] = []
  const px = CubicPoly()
  const py = CubicPoly()
  const pz = CubicPoly()

  const { points, closed = false, type = 'uniform', tension = 0.5 } = opts

  const l = points.length
  const p = (l - (closed ? 0 : 1)) * t
  let intPoint = Math.floor(p)
  let weight = p - intPoint

  if (closed) {
    intPoint += intPoint > 0 ? 0 : (Math.floor(Math.abs(intPoint) / l) + 1) * l
  } else if (weight === 0 && intPoint === l - 1) {
    intPoint = l - 2
    weight = 1
  }

  let p0, p3 // 4 points

  if (closed || intPoint > 0) {
    p0 = points[(intPoint - 1) % l]
  } else {
    // extrapolate first point
    sub(tmp1, points[0], points[1])
    add(tmp1, tmp1, points[0])
    p0 = tmp1
  }

  const p1 = points[intPoint % l]
  const p2 = points[(intPoint + 1) % l]

  if (closed || intPoint + 2 < l) {
    p3 = points[(intPoint + 2) % l]
  } else {
    // extrapolate last point
    sub(tmp2, points[l - 1], points[l - 2])
    add(tmp2, tmp2, points[l - 1])
    p3 = tmp2
  }

  if (type === 'centripetal' || type === 'chordal') {
    // init Centripetal / Chordal Catmull-Rom
    const pow = type === 'chordal' ? 0.5 : 0.25
    let dt0 = Math.pow(distSq(p0, p1), pow)
    let dt1 = Math.pow(distSq(p1, p2), pow)
    let dt2 = Math.pow(distSq(p2, p3), pow)

    // safety check for repeated points
    if (dt1 < 1e-4) dt1 = 1.0
    if (dt0 < 1e-4) dt0 = dt1
    if (dt2 < 1e-4) dt2 = dt1

    px.initNonuniformCatmullRom(p0[0], p1[0], p2[0], p3[0], dt0, dt1, dt2)
    py.initNonuniformCatmullRom(p0[1], p1[1], p2[1], p3[1], dt0, dt1, dt2)
    pz.initNonuniformCatmullRom(p0[2], p1[2], p2[2], p3[2], dt0, dt1, dt2)
  } else if (type === 'catmullrom' || type === 'uniform') {
    px.initCatmullRom(p0[0], p1[0], p2[0], p3[0], tension)
    py.initCatmullRom(p0[1], p1[1], p2[1], p3[1], tension)
    pz.initCatmullRom(p0[2], p1[2], p2[2], p3[2], tension)
  }

  out[0] = px.calc(weight)
  out[1] = py.calc(weight)
  out[2] = pz.calc(weight)

  return out
}

interface COptions extends Options {
  arcLengthDivisions: number
}

export function CatmullRomSpline(
  points: number[][] = [],
  opts: Partial<COptions> = {}
) {
  const {
    closed = false,
    type = 'uniform',
    tension = 0.5,
    arcLengthDivisions = 200
  } = opts

  function getArcLengths(
    divisions: number = spline.arcLengthDivisions
  ): number[] {
    const out = []
    let last: number[] = getPoint(0)
    let current: number[]
    let p: number
    let sum = 0

    out.push(0)

    for (p = 1; p <= divisions; p++) {
      current = getPoint(p / divisions)
      sum += dist(current, last)
      out.push(sum)
      last = current
    }

    return out
  }

  function getPoints(n: number, spaced: boolean) {
    const arclengths = getArcLengths()
    const paths: number[][] = []

    for (let i = 0; i < n; i++) {
      const t = spline.closed ? i / n : i / (n - 1)
      const p: number[] = spaced
        ? getSpacedPoint(t, undefined, arclengths)
        : getPoint(t)
      paths.push(p)
    }
    return paths
  }

  function getPoint(t: number, out?: number[]): number[] {
    return getCatmullRomPoint(spline, t, out)
  }

  function getSpacedPoint(
    u: number,
    out: number[] | undefined,
    arcLengths: number[]
  ): number[] {
    const t = getUtoTMapping(u, undefined, arcLengths)

    return getPoint(t, out)
  }

  function getUtoTMapping(
    u: number,
    distance?: number,
    arcLengths: number[] = getArcLengths()
  ) {
    let i = 0
    const il = arcLengths.length

    let targetArcLength: number // The targeted u distance value to get

    if (distance !== undefined) {
      targetArcLength = distance
    } else {
      targetArcLength = u * arcLengths[il - 1]
    }

    // binary search for the index with largest value smaller than target u distance

    let low = 0
    let high = il - 1
    let comparison

    while (low <= high) {
      i = Math.floor(low + (high - low) / 2) // less likely to overflow, though probably not issue here, JS doesn't really have integers, all numbers are floats

      comparison = arcLengths[i] - targetArcLength

      if (comparison < 0) {
        low = i + 1
      } else if (comparison > 0) {
        high = i - 1
      } else {
        high = i
        break

        // DONE
      }
    }

    i = high

    if (arcLengths[i] === targetArcLength) {
      return i / (il - 1)
    }

    // we could get finer grain at lengths, or use simple interpolation between two points

    const lengthBefore = arcLengths[i]
    const lengthAfter = arcLengths[i + 1]

    const segmentLength = lengthAfter - lengthBefore

    // determine where we are between the 'before' and 'after' points

    const segmentFraction = (targetArcLength - lengthBefore) / segmentLength

    // add that fractional amount to t

    const t = (i + segmentFraction) / (il - 1)

    return t
  }

  const spline = {
    closed,
    type,
    tension,
    points,
    arcLengthDivisions,
    getArcLengths,
    getPoints,
    getPoint,
    getSpacedPoint,
    getUtoTMapping
  }

  return spline
}

// const spline = CatmullRomSpline(points, {
//   closed,
//   tension,
//   type
// })
//
// let from = (a) => a
// let to = (a) => a
//
// return ramp((u) => {
//   const sample = spline.getPoint(u)
//   // let point = jitter ? jitterInSpace(sample) : sample
//   let point = sample
//   return to(point)
// })
