/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("s0su273ui1i8hx0")

  collection.indexes = [
    "CREATE UNIQUE INDEX `idx_5GXuyPI` ON `documents` (`filename`)"
  ]

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("s0su273ui1i8hx0")

  collection.indexes = []

  return dao.saveCollection(collection)
})
