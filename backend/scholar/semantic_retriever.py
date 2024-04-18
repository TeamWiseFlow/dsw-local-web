from typing import List, Dict
import os

import pnlp

from pipelines.document_stores import FAISSDocumentStore
from pipelines.nodes import DensePassageRetriever


class SemanticRetriever:

    def __init__(
        self,
        index_dir: str,
        index_name: str,
        topk: int = 20,
        use_gpu: bool = False,
        max_seq_len_query: int = 128,
        max_seq_len_passage: int = 512,
        retriever_batch_size: int = 6,
    ):
        index_file = os.path.join(index_dir, f"{index_name}_faiss")
        if not os.path.exists(index_file):
            pnlp.check_dir(index_dir)
            self.ds = FAISSDocumentStore(
                sql_url=f"sqlite:///{index_dir}/{index_name}_faiss_document_store.db",
                index_name=index_name,
                duplicate_documents="skip",
                embedding_dim=768,
                faiss_index_factory_str="Flat")
        else:
            config_file = os.path.join(index_dir, f"{index_name}_faiss.json")
            config = pnlp.read_json(config_file)
            config["index_name"] = config["index"]
            pnlp.write_json(config_file, config, indent=2)
            self.ds = FAISSDocumentStore.load(
                index_file, config_file
            )
        self.index_file = index_file
        self.index_name = index_name

        self.max_seq_len_query = max_seq_len_query
        self.max_seq_len_passage = max_seq_len_passage
        self.retriever_batch_size = retriever_batch_size

        if self.index_name == "qa":
            passage_embed_model = "query"
        else:
            passage_embed_model = "para"

        passage_embed_model = "para"

        self.retriever = DensePassageRetriever(
            document_store=self.ds,
            query_embedding_model="rocketqa-zh-dureader-query-encoder",
            passage_embedding_model=f"rocketqa-zh-dureader-{passage_embed_model}-encoder",
            max_seq_len_query=self.max_seq_len_query,
            max_seq_len_passage=self.max_seq_len_passage,
            batch_size=self.retriever_batch_size,
            top_k=topk,
            use_gpu=use_gpu,
            embed_title=False)

    def retrieve(self, q: str) -> List:
        res = self.retriever.retrieve(q)
        for item in res:
            ans = item.meta.pop("answer")
            item.answer = ans
        return res

    def update_embedding_and_save_index(self):
        self.ds.update_embeddings(
            self.retriever,
            update_existing_embeddings=False)
        self.ds.save(self.index_file)

    def _convert(self, docs: List[Dict]) -> List[Dict]:
        res = []
        for doc in docs:
            cont = doc["content"]
            file_type = doc["file_type"]
            # faq 不需要语义搜索
            # if file_type == "faq":
            #     continue
            im = {
                "id": doc["uuid"],
                "content": cont,
                "meta": {
                    "name": doc["file_name"],
                    "file_type": file_type,
                    "topic": doc["topic"],
                    "answer": doc["answer"],
                    "source": "semantic",
                }
            }
            res.append(im)
        return res

    def add_docs(self, docs: List[Dict]):
        data = self._convert(docs)
        self.ds.write_documents(
            data,
            index=self.index_name,
            duplicate_documents="skip")
        self.update_embedding_and_save_index()

    def delete_docs(self, doc_ids: List[str]):
        self.ds.delete_documents(index=self.index_name, ids=doc_ids)
        self.update_embedding_and_save_index()
