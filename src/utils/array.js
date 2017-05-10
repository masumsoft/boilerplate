export function ensureArray(value) {
  let array = value || [];
  if (!Array.isArray(array)) {
    array = [array];
  }
  return array;
}
