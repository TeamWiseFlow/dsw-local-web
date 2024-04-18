import pnlp

from whoosh.analysis import RegexTokenizer, LowercaseFilter
from whoosh.analysis import Filter

from .tokenizer.config import dict_root



class StopWords:

    def __init__(self):
        custom_stopwords = pnlp.read_lines(dict_root / "custom_stopwords.txt")
        self._stopwords = (
            pnlp.stopwords.chinese_stopwords |
            pnlp.stopwords.english_stopwords |
            set(custom_stopwords)
        )

    @property
    def stopwords(self):
        return self._stopwords


STOP_WORDS = StopWords().stopwords


class StopFilter(Filter):
    def __call__(self, tokens):
        for t in tokens:
            if t.text in STOP_WORDS:
                continue
            yield t


qa_analyzer = RegexTokenizer() | LowercaseFilter() | StopFilter()