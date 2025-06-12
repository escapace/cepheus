/* parametric-logistic-lift.ts
 * ---------------------------------------------------------------------------
 * Smoothly “lifts” a value in the interval (0 … 0.5) toward 0.5 using a
 * logistic-shaped curve whose steepness can be tuned with a single parameter k.
 *
 *  - For x ≤ 0 the function is clamped to 0.
 *  - For x ≥ 0.5 the function is clamped to 0.5.
 *  - For 0 < x < 0.5 the output lies strictly between x and 0.5.
 *
 * Passing k = 40 reproduces the legacy implementation.
 * ---------------------------------------------------------------------------
 */

// ---- helper: logistic sigmoid σ(z) --------------------------------------
const sigma = (z: number): number => 1 / (1 + Math.exp(-z))

export function parametricLogisticLift(
  x: number,
  k = 40, // larger k  ⇒ steeper transition, k > 0
  center = 0.1, // centre of the logistic, keep configurable just in case
): number {
  // ---- guard-clause: keep callers safe ------------------------------------
  if (x <= 0) return 0
  if (x >= 0.5) return 0.5
  if (k <= 0) throw new RangeError('k must be positive')

  // Pre-compute σ(−k·mid) once for numeric stability & speed
  const sigmaNeg = sigma(-k * center)
  const denom = 1 - sigmaNeg // always > 0 because 0 < σ < 1

  // ---- lift term L(x) -----------------------------------------------------
  const lift = (sigma(k * (x - center)) - sigmaNeg) / denom

  // ---- final blended value ------------------------------------------------
  return x + (0.5 - x) * lift
}
