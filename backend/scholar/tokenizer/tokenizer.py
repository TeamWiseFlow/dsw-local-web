from typing import List, Union
from pathlib import Path

import jieba
import pnlp

from .config import dict_root


class Tokenizer:

    def __init__(self, cust_suffix: str = "*.txt"):
        self.suffix = cust_suffix
        self._tk = jieba.Tokenizer()
        self.custom_words = []
        self.load_custom_words(dict_root / "custom_words.txt")

    def load_custom_words(self, path: str):
        path = Path(path)
        if path.is_dir():
            for fp in path.glob(self.suffix):
                self._load_custom_words_from_file(fp)
        else:
            self._load_custom_words_from_file(path)

    def _load_custom_words_from_file(self, path: str):
        for line in pnlp.read_lines(path):
            line = line.strip()
            if line.startswith("#"):
                continue
            self.add_words(line)

    def get_freq(self, word: str) -> int:
        return self._tk.FREQ.get(word, 0)

    def cut(self, text: str) -> List[str]:
        words = self._tk.lcut_for_search(text)
        return words

    def add_words(self, words: Union[List[str], str]) -> None:
        if isinstance(words, str):
            words = [words]
        for line in words:
            self._add_word(line)

    def _add_word(self, word: str) -> None:
        word = word.strip()
        tmp = word.split(",")
        if len(tmp) == 1:
            self._tk.add_word(tmp[0])
        else:
            self._tk.add_word(tmp[0], int(tmp[1]))
        self.custom_words.append(word)

    def del_words(self, words: Union[str, List[str]]) -> None:
        if isinstance(words, str):
            words = [words]
        for w in words:
            self._del_word(w)

    def _del_word(self, word) -> None:
        self._tk.del_word(word)
