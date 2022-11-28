export const distance = (px: number, py: number, qx = 0, qy = 0) =>
  Math.hypot(px - qx, py - qy)
