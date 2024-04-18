from typing import List

import rocketqa as ra

from .data_model import PaddleDoc


class Ranker:

    def __init__(
        self,
        model_or_config_path: str,
        use_gpu: bool = False,
    ):
        self.ranker = ra.load_model(
            model_or_config_path, use_cuda=use_gpu, device_id=0, batch_size=1
        )

    def rank(self, query: str, docs: List[PaddleDoc]) -> List[PaddleDoc]:
        paras = [d.content for d in docs]
        titles = [d.meta.topic for d in docs]
        queries = [query for i in range(len(docs))]
        probs = self.ranker.matching(queries, paras, titles)
        probs = list(probs)
        for i, doc in enumerate(docs):
            doc.rank_score = probs[i]
        sort = sorted(docs, key=lambda x: -x.rank_score)
        return sort

    def __call__(self, query: str, docs: List[PaddleDoc]) -> List[PaddleDoc]:
        return self.rank(query, docs)
