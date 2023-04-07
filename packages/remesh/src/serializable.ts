export type SerializablePrimitives = void | undefined | number | string | boolean | null

export type SerializableArray = Serializable[]

export type SerializableObject = { [key: string]: Serializable }

export type ToJson = {
  toJSON(): string
}

export type Serializable = SerializablePrimitives | SerializableArray | SerializableObject | Serializable[] | ToJson
