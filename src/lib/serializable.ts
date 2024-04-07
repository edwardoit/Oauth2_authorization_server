interface vest {}

export type Serialized<T> = T extends vest
  ? T extends { toJSON(): infer R }
    ? { [k in keyof R]: Serialized<R[k]> }
    : { [k in keyof T]: Serialized<T[k]> }
  : T;

export function serialize<T>(val: T): Serialized<T> {
  return JSON.parse(JSON.stringify(val));
}
