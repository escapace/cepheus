// function erf(x: number) {
//     const t = 1 / (1 + 0.5 * Math.abs(x));
//     const tau =
//         t *
//         Math.exp(
//             -x * x +
//                 ((((((((0.17087277 * t - 0.82215223) * t + 1.48851587) * t -
//                     1.13520398) *
//                     t +
//                     0.27886807) *
//                     t -
//                     0.18628806) *
//                     t +
//                     0.09678418) *
//                     t +
//                     0.37409196) *
//                     t +
//                     1.00002368) *
//                     t -
//                 1.26551223
//         );
//     if (x >= 0) {
//         return 1 - tau;
//     } else {
//         return tau - 1;
//     }
// }

export function erfc(x: number): number {
  const z = Math.abs(x)
  const t = 1 / (1 + z / 2)
  // prettier-ignore
  const r = t * Math.exp(-z * z - 1.265_512_23 + t * (1.000_023_68 +
          t * (0.374_091_96 + t * (0.096_784_18 + t * (-0.186_288_06 +
          t * (0.278_868_07 + t * (-1.135_203_98 + t * (1.488_515_87 +
          t * (-0.822_152_23 + t * 0.170_872_77)))))))));

  return x >= 0 ? r : 2 - r
}
