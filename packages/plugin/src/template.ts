export const templateSRGB = (values: string[]) =>
  `:root { ${values.join(' ')} }`
export const templateP3 = (values: string[]) =>
  `@supports (color: color(display-p3 1 1 1)) { :root { ${values.join(' ')} } }`
