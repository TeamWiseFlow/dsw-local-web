from dataclasses import asdict
from typing import List
import os
import shutil


from whoosh.index import create_in
from whoosh import index


from .schema import KeywordsRetriverSchema
from .data_model import WhooshDoc


class Indexer:

    def __init__(self, index_path: str, index_name: str):
        if not os.path.exists(index_path):
            os.mkdir(index_path)
            try:
                self.ix = create_in(
                    index_path,
                    schema=KeywordsRetriverSchema(),
                    indexname=index_name
                )
            except Exception:
                shutil.rmtree(index_path)
        else:
            try:
                self.ix = index.open_dir(index_path, indexname=index_name)
            except Exception:
                self.ix = create_in(
                    index_path,
                    schema=KeywordsRetriverSchema(),
                    indexname=index_name
                )
        self.index_path = index_path

    def add_docs(self, docs: List[WhooshDoc]) -> None:
        writer = self.ix.writer()
        for doc in docs:
            writer.add_document(**asdict(doc))
        writer.commit()

    def delete_docs(self, docs: List[WhooshDoc]) -> None:
        writer = self.ix.writer()
        for doc in docs:
            writer.delete_by_term("uuid", doc.uuid)
        writer.commit()

    def delete_docs_by_uuid(self, ids: List[str]) -> None:
        writer = self.ix.writer()
        for uuid in ids:
            writer.delete_by_term("uuid", uuid)
        writer.commit()

    def delete_docs_by_file(self, file_names: List[str]) -> None:
        writer = self.ix.writer()
        for fn in file_names:
            writer.delete_by_term("file_name", fn)
        writer.commit()

    def remove(self):
        shutil.rmtree(self.index_path)
