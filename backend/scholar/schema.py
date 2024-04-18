from whoosh.fields import SchemaClass
from whoosh.fields import ID, TEXT, BOOLEAN


from .analyzer import qa_analyzer


class KeywordsRetriverSchema(SchemaClass):

    file_name = TEXT(stored=True)
    file_title = TEXT(stored=True)
    file_type = TEXT(stored=True)
    file_cont_type = TEXT(stored=True)
    uuid = ID(stored=True, unique=True)
    topic = TEXT(stored=True)
    content = TEXT(analyzer=qa_analyzer, stored=True)
    answer = TEXT(stored=True)
    is_splited = BOOLEAN(stored=True)
    index_type = TEXT(stored=True)
