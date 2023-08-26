/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("s0su273ui1i8hx0")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "xqybnpfa",
    "name": "filename",
    "type": "text",
    "required": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("s0su273ui1i8hx0")

  // remove
  collection.schema.removeField("xqybnpfa")

  return dao.saveCollection(collection)
})
