from typing import Optional, Literal
from dataclasses import dataclass, asdict


@dataclass
class WhooshDoc:

    file_name: str
    file_title: str
    file_type: str
    file_cont_type: str
    uuid: str
    topic: str
    _stored_topic: str
    content: str
    _stored_content: str
    answer: str
    is_splited: bool
    index_type: str


@dataclass
class QdrantDoc:

    file_name: str
    file_title: str
    file_type: str
    file_cont_type: str
    uuid: str
    topic: str
    content: str
    answer: str
    is_splited: bool
    index_type: str


@dataclass
class DocMeta:

    file_name: str
    file_title: str
    file_type: str
    file_cont_type: str
    topic: str
    source: str
    is_splited: bool
    index_type: str


@dataclass
class PaddleDoc:

    id: str
    content: str
    content_type: Literal["text", "table", "image"]
    answer: str
    meta: DocMeta
    ann_score: Optional[float] = None
    rank_score: Optional[float] = None
    score: Optional[float] = None

    def to_dict(self):
        return asdict(self)
