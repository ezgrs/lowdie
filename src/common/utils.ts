export type DiscriminatedUnion<TypeMap extends Record<string, object>> = {
    [K in keyof TypeMap]: { type: K } & TypeMap[K]
}[keyof TypeMap]
