from typing import List, Dict
from copy import deepcopy

from whoosh.qparser import MultifieldParser
from whoosh.searching import Results


from .document_processor import TextProcessor
from .indexer import Indexer
from .tokenizer import Tokenizer
from .utils import convert_output_to
from .data_model import WhooshDoc, PaddleDoc
from .config import logger


class KeywordsRetriever:

    def __init__(
        self,
        index_path: str,
        index_name: str = "qa",
        topk: int = 10
    ):

        self.tp = TextProcessor()
        self.tk = Tokenizer()
        self.ir = Indexer(index_path, index_name)

        self.qp = MultifieldParser(
            ["content"],
            schema=self.ir.ix.schema

        )
        self.topk = topk

    def __str__(self):
        return "KeywordsRetriever"

    def retrieve(self, text: str) -> List[Dict]:
        text = self.tp.clean(text)
        words = self.tk.cut(text)
        text_with_space = " ".join(words)
        res = []
        with self.ir.ix.searcher() as searcher:
            logger.info(f"{self} => input: {text}, query: {text_with_space}")
            query = self.qp.parse(text_with_space)
            retrivered: Results = searcher.search(query, limit=self.topk)
            for hit in retrivered:
                dct = dict(hit)
                dct["score"] = hit.score
                res.append(dct)
            logger.info(f"{self} => hits: {res}")
            return res

    @convert_output_to(target="paddle", source="keywords")
    def __call__(self, text: str) -> List[PaddleDoc]:
        return self.retrieve(text)

    def text_with_space(self, text: str) -> str:
        tokens = self.tk.cut(text)
        text_with_space = " ".join(tokens)
        return text_with_space

    def _convert(self, docs: List[Dict]) -> List[WhooshDoc]:
        res = []
        for _doc in docs:
            doc = deepcopy(_doc)
            cont = doc["content"]
            topic = doc["topic"]
            topic_with_space = self.text_with_space(topic)
            cont_with_space = self.text_with_space(cont)
            doc["topic"] = topic_with_space
            doc["_stored_topic"] = topic
            doc["content"] = cont_with_space
            doc["_stored_content"] = cont
            d = WhooshDoc(**doc)
            res.append(d)
        return res

    def add_docs(self, docs: List[Dict]):
        data = self._convert(docs)
        self.ir.add_docs(data)

    def delete_docs(self, doc_ids: List[str]):
        self.ir.delete_docs_by_uuid(doc_ids)
