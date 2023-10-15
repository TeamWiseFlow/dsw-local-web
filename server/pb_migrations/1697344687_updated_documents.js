/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("s0su273ui1i8hx0")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "oj06hm7w",
    "name": "indexed",
    "type": "bool",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("s0su273ui1i8hx0")

  // remove
  collection.schema.removeField("oj06hm7w")

  return dao.saveCollection(collection)
})
