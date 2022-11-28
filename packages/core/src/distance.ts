export const distance = (px: number, py: number, qx = 0, qy = 0) =>
  Math.abs(px - qx) + Math.abs(py - qy)
