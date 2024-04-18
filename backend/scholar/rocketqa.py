from typing import List, Dict
from dataclasses import asdict
import os


import paddle
import rocketqa as ra
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, Record, ScoredPoint


from .utils import convert_output_to
from .data_model import QdrantDoc, PaddleDoc


class SemanticRetriever:

    def __init__(
        self,
        index_dir: str,
        index_name: str,
        model_or_config_path: str,
        topk: int = 20,
        use_gpu: bool = False,
        max_seq_len_query: int = 128,
        max_seq_len_passage: int = 512,
        retriever_batch_size: int = 6,
    ):
        index_path = os.path.join(index_dir, f"{index_name}_qdrant_ds")
        self.ds = QdrantClient(path=index_path)
        collection_path = os.path.join(index_path, "collection", index_name)
        if not os.path.exists(collection_path):
            self.ds.recreate_collection(
                collection_name=index_name,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE)
            )
        self.index_path = index_path
        self.index_name = index_name
        self.topk = topk

        self.max_seq_len_query = max_seq_len_query
        self.max_seq_len_passage = max_seq_len_passage
        self.retriever_batch_size = retriever_batch_size

        self.retriever = ra.load_model(
            model=model_or_config_path,
            use_cuda=use_gpu,
            device_id=0,
            batch_size=1)

    def retrieve(self, q: str) -> List[Dict]:
        qvs = self.retriever.encode_query([q])
        qvs = list(qvs)
        qv = qvs[0].tolist()
        hits: ScoredPoint = self.ds.search(
            collection_name=self.index_name,
            query_vector=qv,
            limit=self.topk
        )
        res = []
        for hit in hits:
            hit.payload["score"] = hit.score
            res.append(hit.payload)
        return res

    @convert_output_to(target="paddle", source="semantic")
    def __call__(self, text: str) -> List[PaddleDoc]:
        paddle.enable_static()
        return self.retrieve(text)

    def _convert(self, docs: List[Dict]) -> List[QdrantDoc]:
        res = []
        for doc in docs:
            # faq 不需要语义搜索
            # if file_type == "faq":
            #     continue
            d = QdrantDoc(**doc)
            res.append(d)
        return res

    def _get_vector(self, content: str, title: str) -> List[float]:
        gen = self.retriever.encode_para(
            [content], title=[title])
        vecs = [v.tolist() for v in gen]
        return vecs[0]

    def add_docs(self, docs: List[Dict]):
        paddle.enable_static()
        data = self._convert(docs)
        self.ds.upload_records(
            collection_name=self.index_name,
            records=[
                Record(
                    id=doc.uuid,
                    vector=self._get_vector(doc.content, doc.topic),
                    payload=asdict(doc)
                ) for _idx, doc in enumerate(data)
            ]
        )

    def delete_docs(self, doc_ids: List[str]):
        self.ds.delete(self.index_name, points_selector=doc_ids)
