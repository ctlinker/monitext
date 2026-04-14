import type { InferSchema } from "@/lib/schema/handle"
import type { NumberSchema, StringSchema, BooleanSchema } from "@/lib/schema/schema"

type t1 = InferSchema<{
    kind: "array",
    items: NumberSchema[],
    prefixItems: [StringSchema, StringSchema]
}>

type t2 = InferSchema<{
    kind: "object",
    properties: {
        test: StringSchema,
        pass: BooleanSchema
    },
    additionalProperties: true,
    required: ["test"]
}>

type t3 = InferSchema<{
    kind: "enum",
    enum: ["test1", "test2", 3]
}>

// TODO: Fix this
//@ts-ignore
type t4 = InferSchema<{
    kind: "intersection",
    types: [{ kind: "string" }, { kind: "number" }]
}>

const obj : t2 = {
    test: "1",
    pass: true,
    plus: 7
}