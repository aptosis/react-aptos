const keyBy = <T, K extends string | number | symbol>(
  array: T[],
  keyFn: (v: T) => K
): Record<K, T> =>
  (array || []).reduce((r, x) => ({ ...r, [keyFn(x)]: x }), {} as Record<K, T>);

export default keyBy;
