export type StringSchema = {
    kind: "string",
    default?: string
}

export type NumberSchema = {
    kind: "number",
    default?: number
}

export type BooleanSchema = {
    kind: "boolean",
    default?: boolean
}

export type NullSchema = {
    kind: "null",
}

export type VoidSchema = {
    kind: "void",
}

export type LiteralSchema<T extends unknown = any> = {
    kind: "literal",
    value: T
}

export type EnumSchema<T extends any[] = []> = {
    kind: "enum",
    enum: T
    default?: T[number]   
}

export type ObjectSchema<T extends Record<string, BasicSchema> = {}, U extends boolean | BasicSchema = false> = {
    kind: "object"
    properties: T,
    additionalProperties?: U
    default?: object
}

export type ArraySchema<T extends boolean | BasicSchema[] = [], U extends BasicSchema[] = []> = {
    kind: "array"
    items: T,
    prefixItems: U,
    default?: unknown[]
}

export type BasicSchema = 
    | StringSchema
    | NumberSchema
    | BooleanSchema
    | ObjectSchema<any, any>
    | ArraySchema<any, any>
    | NullSchema
    | VoidSchema
    | EnumSchema<any>
    | LiteralSchema

export type UnionSchema<U extends BasicSchema[] | IntersectionSchema [] = []> = {
    kind: "union",
    types: U
}

export type IntersectionSchema<U extends BasicSchema[] | UnionSchema [] = []> = {
    kind: "intersection",
    types: U
}
