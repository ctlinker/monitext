import type { ArraySchema, BasicSchema, BooleanSchema, EnumSchema, IntersectionSchema, LiteralSchema, NullSchema, NumberSchema, ObjectSchema, StringSchema, UnionSchema, VoidSchema } from "./schema";

export type InferSchema<S extends
    | BasicSchema
    | UnionSchema
    | IntersectionSchema
> =
    S extends StringSchema
    ? string
    : S extends NumberSchema
    ? number
    : S extends BooleanSchema
    ? boolean
    : S extends NullSchema
    ? null
    : S extends VoidSchema
    ? void
    : S extends LiteralSchema
    ? S["value"]
    : S extends EnumSchema<any>
    ? S["enum"][number]
    : S extends UnionSchema<any> 
    ? HandleUnionSchema<S>
    : S extends IntersectionSchema<any> 
    ? HandleIntersectionSchema<S>
    : S extends ArraySchema<any, any>
    ? HandleArray<S>
    : S extends ObjectSchema<any, any>
    ? HandleObject<S>
    : never

type InferSchemaInArray<L extends any[]> = Array<{
    [K in keyof L]: InferSchema<L[K]>
}>

type InferSchemaInObject<L extends Record<string, any>> = {
    [K in keyof L]: InferSchema<L[K]>
}

type Union<L extends any[]> = L[number]

type Intersection<L extends any[]> = 
    L extends [infer X, ...infer Rest]
    ? Rest extends []
        ? X 
        : X & Intersection<Rest> 
    : never

type HandleUnionSchema<S extends UnionSchema<any>> = Union<
    InferSchemaInArray<S["types"]>
>

type HandleIntersectionSchema<S extends IntersectionSchema<any>> = Intersection<
    InferSchemaInArray<S["types"]>
>

type HandleArray<S extends ArraySchema<any, any>> = 
    S extends { items?: infer X, prefixItems?: infer Y extends any[] } 
    ? ResolveArray<
        InferSchemaInArray<Y>, 
        X extends boolean 
            ? X extends true 
                ? unknown[] 
                : [] 
            : X extends any[] 
                ? InferSchemaInArray<X>
                : []
    >  
    : never

type ResolveArray<T extends any[], U extends any[]> = [
    ...GetTypeOfArray<T>,
    ...(GetTypeOfArray<U>)
]

type GetTypeOfArray<T extends any[]> =     
    T extends (infer Z)[] 
        ? Z
        : never

type HandleObject<S extends ObjectSchema<any, any>> = S extends { 
    properties: infer X extends Record<string, any>, 
    required?: infer Z extends string[],
    additionalProperties?: infer Y,
} ? ResolveObject<
    Z,
    InferSchemaInObject<X>,
    Y extends boolean ? 
        Y extends true 
            ? Record<string, unknown>
            : {}
        : Y extends BasicSchema | UnionSchema | IntersectionSchema
            ? Record<string, InferSchema<Y>>
            : {}
    >
    : never

type ResolveObject<Required extends string[], Props, Add> = 
    Intersection<[
        { [K in keyof Props as K extends Required[number] ? K : never ]: Props[K] },
        { [K in Exclude<keyof Props, Required[number]>]?: Props[K] },
        Add
    ]>

