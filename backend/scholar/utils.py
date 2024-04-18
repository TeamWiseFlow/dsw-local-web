from functools import wraps, partial
from pathlib import Path
from typing import Any
import os
import uuid
import hashlib
import pnlp

from .data_model import PaddleDoc, DocMeta


def get_file_type_from_file_name(inp: str) -> str:
    if inp.startswith("http"):
        return "html"
    file = Path(inp)
    suffix = file.suffix.lower()
    return suffix[1:]


def generate_uuid(*args) -> str:
    s = uuid.uuid5(
        uuid.NAMESPACE_URL,
        "".join(map(str, args))
    )
    return s.hex


def convert_output_to(func=None, *, target: str = "paddle", source: str = "keywords"):

    if func is None:
        return partial(convert_output_to, target=target, source=source)

    @wraps(func)
    def wrapper(*args, **kwargs):
        docs = []
        results = func(*args, **kwargs)
        for im in results:
            meta = DocMeta(
                im.get("file_name"),
                im.get("file_title"),
                im.get("file_type"),
                im.get("file_cont_type"),
                im.get("topic"),
                source,
                im.get("is_splited"),
                im.get("index_type")
            )
            doc = {
                "id": im.get("uuid"),
                "content": im.get("content"),
                "content_type": "text",
                "answer": im.get("answer"),
                "meta": meta,
                "ann_score": im.get("score")
            }
            d = PaddleDoc(**doc)
            docs.append(d)
        return docs

    return wrapper


def md5(string: str) -> str:
    md5 = hashlib.md5(string.encode("utf8"))
    return md5.hexdigest()


class Cache:

    def __init__(self, indexed_file: str):
        self.indexed_file = indexed_file
        if os.path.exists(indexed_file):
            self.cache = pnlp.read_json(indexed_file)
        else:
            self.cache = {}

    def __iter__(self):
        for key in self.cache:
            yield key

    def __contains__(self, key: str) -> bool:
        return key in self.cache

    def __getitem__(self, key: str) -> Any:
        return self.cache.get(key)

    def __len__(self) -> int:
        return len(self.cache)

    def add(self, key: str, val: Any):
        self.cache[key] = val

    def add_nest(self, key1: str, key2: str, val: Any):
        if key1 not in self.cache:
            self.cache[key1] = {}
        self.cache[key1][key2] = val

    def delete(self, key: str):
        if key in self.cache:
            self.cache.pop(key)

    def store(self):
        pnlp.write_json(
            self.indexed_file,
            self.cache,
            indent=2,
            ensure_ascii=False
        )
