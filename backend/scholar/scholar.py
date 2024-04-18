from typing import List, Dict
import os
import re
import datetime
import shutil
from pathlib import Path
import pnlp

from .data_model import PaddleDoc
from .keywords_retriever import KeywordsRetriever
from .rocketqa import SemanticRetriever
from .ranker import Ranker
from .utils import Cache, get_file_type_from_file_name
from .config import CACHE_ROOT, DOC_ROOT, INDEX_ROOT, WHOOSH_INDEX_DIR, FAISS_INDEX_DIR, MODEL_ROOT
from .config import logger

from .document_processor import TextProcessor
from .document_processor import DocReader, PDFReader, HtmlReader, ExcelReader, PPTReader


speech_dict = {
    "wrong_input": "文件库资料仅支持word、pdf、图片和文本信息哦~请您提交正确的文件格式",
    "operation_failed": "文件转存出错啦，好心人不介意再试一次吧[微笑]",
    "duple_file": "文件库已经有同名文件啦，请联系管理员操作",
    "empty_library": "文件库还没有资料哦，先联系管理员给我一些学习资料吧~",
    "asr_failed": "抱歉，没听清呢，好心人不介意再试一次吧~",
    "others": "数字社工助理开小差了，请联系管理员处理哦～",
    "no_answer": "未检索到相关信息，请换个问题或联系管理员查证",
    "add_success": "索引库文件添加成功!",
    "del_success": "索引库文件删除成功!",
    "add_failed": "索引库文件添加失败",
    "del_failed": "删除文件失败",
}


class Scholar:
    """
    接收收入的文档（word、pdf、txt、img），通过docreader接口统一处理为txt，
    前端对接wechatyUI/smartqa
    """

    def __init__(
        self,
        initial_file_dir: str = None,
        index_name: str = "qa",
        use_gpu: bool = False,
    ):

        indexed_cache_file = os.path.join(
            INDEX_ROOT, f"{index_name}_indexed_doc.cache.json")
        self.cache = Cache(indexed_cache_file)
        topic_indexed_cache_file = os.path.join(
            INDEX_ROOT, f"{index_name}_indexed_topic.cache.json")
        self.topic_cache = Cache(topic_indexed_cache_file)
        file_indexed_cache_file = os.path.join(
            INDEX_ROOT, f"{index_name}_indexed_file.cache.json")
        self.file_cache = Cache(file_indexed_cache_file)

        self.tp = TextProcessor()

        self.use_gpu = use_gpu
        self.docreader = DocReader()
        self.excelreader = ExcelReader()
        self.pdfreader = PDFReader(use_gpu=self.use_gpu)
        self.pptreader = PPTReader(use_gpu=self.use_gpu)
        self.htmlreader = HtmlReader()

        self.retriever_topk = 10
        kw_retriever_topk = 10
        sm_retriever_topk = 50
        self.kw_retriever = KeywordsRetriever(
            WHOOSH_INDEX_DIR,
            index_name="qa",
            topk=kw_retriever_topk,
        )
        model_or_config_path = os.path.join(
            MODEL_ROOT,
            "rocketqa/de_models/config.json"
        )
        self.sm_retriever = SemanticRetriever(
            FAISS_INDEX_DIR,
            index_name="qa",
            model_or_config_path=model_or_config_path,
            topk=sm_retriever_topk,
            use_gpu=self.use_gpu)

        self.ranker = Ranker(
            model_or_config_path=os.path.join(
                MODEL_ROOT,
                "rocketqa/ce_models/config.json"),
            use_gpu=self.use_gpu)

        # self.reader = ErnieReader(
        #    model_name_or_path="ernie-gram-zh-finetuned-dureader-robust",
        #    use_gpu=self.use_gpu)

        # self.pipe = ExtractiveQAPipeline(self.reader, self.ranker, self.sm_retriever.retriever)

        self.library_len = len(self.cache)

        self._ranker_topn = 15
        self._ranker_low_threshold = 0.5
        self._ranker_high_threshold = 0.9

        self.reg_split_sent = re.compile(r"[。！？]")

        self.supported_file_types = [
            "docx",
            "doc",
            "pptx",
            "ppt",
            "pdf",
            "jpg",
            "jpeg",
            "png",
            "txt",
            "json",
            "html",
            "xls",
            "xlsx",
        ]

        if self.check_raw_file_dir(initial_file_dir):
            self.convert_files_to_text(initial_file_dir, DOC_ROOT)
            self.initialize_index(DOC_ROOT)

    @property
    def ranker_topn(self):
        return self._ranker_topn

    @property
    def ranker_low_threshold(self):
        return self._ranker_low_threshold

    @property
    def ranker_high_threshold(self):
        return self._ranker_high_threshold

    @ranker_topn.setter
    def ranker_topn(self, value):
        self._ranker_topn = value

    @ranker_low_threshold.setter
    def ranker_low_threshold(self, value):
        self._ranker_low_threshold = value

    @ranker_high_threshold.setter
    def ranker_high_threshold(self, value):
        self._ranker_high_threshold = value

    def check_raw_file_dir(self, data_path: str) -> bool:
        if data_path and os.path.exists(data_path):
            return True
        return False

    def convert_files_to_text(self, raw_path: str, doc_path: str):
        file_suffix = "|".join(["." + v for v in self.supported_file_types])
        dst_files = [v.stem for v in pnlp.Reader.gen_files(doc_path, "*.txt")]
        src_files = pnlp.Reader.gen_files(
            raw_path, file_suffix, use_regex=True)
        for file in sorted(src_files):
            fn = file.stem
            if fn in dst_files:
                continue
            file_type = get_file_type_from_file_name(file.as_posix())
            self._convert_and_copy(file, file_type)

    def initialize_index(self, data_path: str):
        # NOTE: all file should convert to ==> txt or json
        for file in pnlp.Reader.gen_files(
                data_path, ".txt|.json", use_regex=True):
            logger.info(f"initialize library---{self} add_file: {file}")
            self.add_file(file.as_posix())

    def _convert_and_copy(self, file_path: str, file_type: str) -> str:
        timestmp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        temp_dir = os.path.join(CACHE_ROOT, timestmp)
        pnlp.check_dir(temp_dir)
        if file_type in ["jpg", "jpeg", "png"]:
            filename = self.pdfreader.convert_img(file_path, temp_dir)
        elif file_type in ["doc", "docx"]:
            filename = self.docreader.convert(file_path, temp_dir)
        elif file_type in ["xls", "xlsx"]:
            filename = self.excelreader.convert(file_path, temp_dir)
        elif file_type == "pdf":
            filename = self.pdfreader.convert(file_path, temp_dir)
        elif file_type in ["ppt", "pptx"]:
            filename = self.pptreader.convert(file_path, temp_dir)
        elif file_type in ["html"]:
            filename = self.htmlreader.convert(file_path, temp_dir)
        elif file_type in ["txt", "json"]:
            file = Path(file_path)
            tmp_file = os.path.join(temp_dir, file.name)
            shutil.copy(file, tmp_file)
            filename = file.name
        else:
            filename = ""

        if filename:
            src = os.path.join(temp_dir, filename)
            dst = os.path.join(DOC_ROOT, filename)
            shutil.copy(src, dst)
        else:
            dst = ""
        shutil.rmtree(temp_dir)
        return dst

    def get_first_sent(self, inp: str) -> str:
        lst = self.reg_split_sent.split(inp)
        first = lst[0]
        return first

    def eval(self, question: str):
        kw_recalled = self.kw_retriever(question)
        sm_recalled = self.sm_retriever(question)
        ranked_res = self.ranker(question, sm_recalled)
        res = {"semantic": {}, "keyword": {}, "rank": {}}
        if sm_recalled:
            topn = list(set([v.meta["topic"] for v in sm_recalled]))
            res["semantic"]["recall"] = ",".join(topn)
        if ranked_res:
            top1 = ranked_res[0]
            res["rank"]["topic"] = top1.meta["topic"]
            res["rank"]["score"] = top1.rank_score
            res["rank"]["answer"] = top1.answer

        if kw_recalled:
            top1 = kw_recalled[0]
            res["keyword"]["topic"] = top1.meta["topic"]
            res["keyword"]["score"] = top1.ann_score
            res["keyword"]["answer"] = top1.answer

        return res

    def ask(
        self,
        question: str,
    ) -> dict:
        """
        入参格式：
        requirement[optional]:str="all", requirement用于指定查询库的范围，fn为只从file index查，qn为只从qa index查，默认是两个混合查
        出参格式：
        {"flag":int, "result":[{"type":str,"answer":str}]}
        其中type指定为 text或者file，answer为contents
        flag = 0，返回结果自信
        flag = 1，没有匹配到答案,返回空字符串
        flag = 2，不自信返回
        result 按ranker后取topN（与recall的topN相同）结果组成列表返回
        异常情况（含没有找到答案）按一条text类型答案返回，flag=0
        """
        question = re.sub(
            r"[^a-zA-Z\d\u4e00-\u9fa5\-+=【】{}、|；‘’：“”《》？，。`~!#$%^&*()_\[\]\\;':\",./<>?…]",
            "",
            question)

        if self.library_len == 0 or len(question) == 0:
            return {"flag": 1, "result": [
                {"type": "text", "answer": speech_dict["no_answer"]}]}

        sm_recalled: List[PaddleDoc] = self.sm_retriever(question)
        sm_qa_recalled, sm_file_recalled = [], []
        for v in sm_recalled:
            if v.meta.index_type == "qa":
                sm_qa_recalled.append(v)
            elif v.meta.index_type == "file":
                sm_file_recalled.append(v)
        sm_qa_recalled = sm_qa_recalled[: self.retriever_topk // 2]
        sm_file_recalled = sm_file_recalled[: self.retriever_topk // 2]
        kw_recalled: List[PaddleDoc] = self.kw_retriever(question)

        sm_recalled_ids = set([v.id for v in sm_qa_recalled + sm_file_recalled])
        # 关键词（问题+答案）+语义
        recalled = sm_qa_recalled + sm_file_recalled
        # 去重
        for doc in kw_recalled:
            if doc.id not in sm_recalled_ids:
                recalled.append(doc)

        # 关键词（只问题）
        logger.info(f"\n问题：{question}")

        if not recalled:
            return {"flag": 1, "result": [
                {"type": "text", "answer": speech_dict["no_answer"]}]}

        ranked_res = self.ranker(question, recalled)
        logger.info(f"\n排序结果: {ranked_res}")

        filtered_res = [
            v for v in ranked_res if v.rank_score >= self.ranker_low_threshold]
        topn_res = filtered_res[:self.ranker_topn]

        qa_res = [_res for _res in topn_res if _res.meta.index_type == "qa"]
        fs_res = [_res for _res in topn_res if _res.meta.index_type == "file"]

        # 先处理qa answer
        flag = 1
        answers = []

        if qa_res:
            top1 = qa_res[0]
            qa_answer_score = top1.rank_score
            if top1.rank_score >= self.ranker_high_threshold:
                qa_answer = self.build_qa_index_answer(top1)
                logger.info(f"\n\n最终结果：Top1答案: {top1}")
            else:
                topics = list(set([v.meta.topic for v in qa_res if v]))
                if len(qa_res) == 1:
                    qa_answer = self.build_qa_index_answer(top1)
                    flag = 2
                    logger.info(f"\n\n最终结果：只有一个候选，ai并不确定：Top1答案: {top1}")
                elif len(qa_res) > 1 and len(topics) == 1 and topics[0] != "":
                    topic = topics[0]
                    name = top1.meta.file_title
                    logger.info(f"DEBUG: {name}, {topic}")
                    topic_ans = self.topic_cache[name][topic]
                    qa_answer = f"{topic}\n{topic_ans}"
                    logger.info(
                        f"\n\n最终结果：多条指向答案但属于同一个Topic： {topic}")
                else:
                    qs = [
                        v.content +
                        f"---{v.meta.file_title}" for v in qa_res]
                    qa_answer = "\n".join(qs)
                    qa_answer = f"您要问的是如下哪个？：\n\n{qa_answer}"
                    logger.info(f"\n\n最终结果：TopN问题: {qa_res}")

            answers.append({"score": qa_answer_score, "answer": qa_answer})

        # 对于文件类，只要rank_score大于等于低阈值，就直接采纳
        has = set()
        for doc in fs_res:
            if doc.rank_score >= self.ranker_low_threshold:
                logger.info(f"\n\n找到文件：{doc}")
                if doc.meta.file_name not in has:
                    ans = self.build_file_index_answer(doc)
                    answers.append({"score": doc.rank_score, "answer": ans})
                    has.add(doc.meta.file_name)

        # 如果answer不为空则按score排序，如果为空则进行兜底流程
        if answers:
            # 还是要排序，因为qa_answer和fs_answer是分开处理后再放入answers里面的
            answers.sort(key=lambda k: (k.get('score')), reverse=True)
        else:
            if kw_recalled:
                top1 = kw_recalled[0]
                if top1.meta.index_type == "qa":
                    answer = self.build_qa_index_answer(top1)
                    answers.append(
                        {"score": top1.rank_score, "answer": answer})
                elif top1.meta.index_type == "file":
                    fs_res = [_res for _res in filtered_res if _res.meta.index_type ==
                              "file" and _res.meta.source == "keywords"]
                    for doc in fs_res:
                        if doc.rank_score >= self.ranker_low_threshold:
                            if doc.meta.file_name not in has:
                                ans = self.build_file_index_answer(top1)
                                answers.append(
                                    {"score": doc.rank_score, "answer": ans})
                                has.add(doc.meta.file_name)
                flag = 2
                logger.info(f"\n\n最终结果：兜底答案，ai并不确定： {answers}")
            else:
                # 无答案返回
                logger.info("no answer")
                return {"flag": 1, "result": [
                    {"type": "text", "answer": speech_dict["no_answer"]}]}

        # 最终输出格式处理
        if answers and flag != 2:
            flag = 0

        for ans in answers:
            if ans["answer"].startswith("<FILE>"):
                ans["type"] = "file"
                ans["answer"] = ans["answer"][6:]
            else:
                ans["type"] = "text"

        return {"flag": flag, "result": answers}

    def build_file_index_answer(self, doc: PaddleDoc) -> str:
        # 答案内容的拼接方案跟之前一样
        if doc.meta.file_type == "html":
            _topic = doc.meta.topic
            _ans = doc.answer or doc.content
            ans = f"{_topic}\n{_ans}\n\n{doc.meta.file_name}"
        else:
            ans = f"<FILE>{doc.meta.file_name}"  # 这里就是拼接原文件名（前端add file是传进来的）
        return ans

    def build_qa_index_answer(self, doc: PaddleDoc) -> str:
        """
        如果是file类型的，answer为file name
        qa answer，需要在每一条答案前拼接字符：“为您的提问找到如下参考：\n\n”
        """
        topic = doc.meta.topic
        if (
            # 未被切分
            # NOTE: html永远不能返回文件
            (doc.meta.is_splited == False and doc.meta.file_type not in ["html"]) or
            # 扫描件、图片
            doc.meta.file_type in ["jpg", "jpeg", "png", "ppt", "pptx", "pdf"]
        ):
            ans = "<FILE>"
        else:
            ans = doc.answer or doc.content
            ans = f"为您的提问找到如下参考：\n\n{topic}\n{ans}"
        if doc.meta.file_type in ["html"]:
            ans += "\n\n" + doc.meta.file_name
        return ans

    def get_typ_fn_ft_from_file(self, file: str):
        file_type = get_file_type_from_file_name(file)

        if file_type in ["html"]:
            # NOTE: 网页链接
            fn = file
        else:
            # NOTE: 文件名(带后缀)
            fp = Path(file)
            fn = fp.name
        return file_type, fn

    def add_file(self, file: str, name: str = "") -> dict:
        file_type, file_name = self.get_typ_fn_ft_from_file(file)
        if name:
            file_name = name

        if file_type not in self.supported_file_types:
            logger.warning(f"add_file input type error: {file}")
            return {"flag": -5,
                    "result": [{"type": "text",
                                "answer": speech_dict["wrong_input"]}]}

        key = file_name
        if key in self.cache:
            return {"flag": -1,
                    "result": [{"type": "text",
                                "answer": speech_dict["duple_file"]}]}

        try:
            file_path = self._convert_and_copy(file, file_type)
        except Exception as e:
            logger.warning(f"add_file convert failed: {file}. Reason: {e}")
            return {"flag": -4,
                    "result": [{"type": "text",
                                "answer": speech_dict["operation_failed"]}]}

        if not file_path:
            logger.warning(f"add_file input type error: {file}")
            return {"flag": -5,
                    "result": [{"type": "text",
                                "answer": speech_dict["wrong_input"]}]}

        file_cont_type = self.tp.guess_file_cont_type(file_path)
        parse_type = self.tp.guess_parse_type(file_cont_type, file_type)
        # 实际list到前端的文件名
        converted_file_title = Path(file_path).stem
        logger.info(f"添加文件：file_cont_type: {file_cont_type}, parse_type: {parse_type}, converted_file_title: {converted_file_title}")
        # file_path: 转换后的文件名（txt文件）
        # file_type：文件后缀（网页除外，网页统一为html）
        # fn：传入的最原始的文件名，带后缀，网页就是原始链接
        if parse_type == "doc_qa":
            # 按文件内容类型区分处理
            docs: List[Dict] = self.tp.parse_text_file_4qa(
                file_path, file_type, file_name, converted_file_title, file_cont_type)
        else:
            # 按索引类型区分处理，而且不关心qa
            docs: List[Dict] = self.tp.parse_text_file_4fs(
                file_path, file_type, file_name, converted_file_title, parse_type)

        logger.debug(f"length docs: {len(docs)}")
        for doc in docs:
            logger.debug(f"added doc: {doc}")
            if doc["need_cache_topic"]:
                # topic_cache_key = doc["topic"]
                topic_key = doc["content"]  # the same as doc["topic"]
                topic_val = doc["answer"]
                self.topic_cache.add_nest(key, topic_key, topic_val)
            doc.pop("need_cache_topic")

        self.kw_retriever.add_docs(docs)
        self.sm_retriever.add_docs(docs)

        self.cache.add(key, docs)
        self.cache.store()
        self.topic_cache.store()

        self.file_cache.add(converted_file_title, key)
        self.file_cache.store()

        self.library_len = len(self.cache)
        return {"flag": 0, "result": [
            {"type": "text", "answer": speech_dict["add_success"]}]}

    def del_file(self, converted_file_title: str) -> dict:
        converted_file_title = Path(converted_file_title).stem
        raw_file_name = self.file_cache[converted_file_title]
        file_path = ""
        for file in Path(DOC_ROOT).glob("*"):
            if (
                file.name == raw_file_name or
                file.stem == converted_file_title
            ):
                file_path = file
                break

        if file_path:
            os.remove(file_path)
            key = raw_file_name
            docs = self.cache[key]
            doc_ids = [v["uuid"] for v in docs]
            self.kw_retriever.delete_docs(doc_ids)
            self.sm_retriever.delete_docs(doc_ids)

            self.cache.delete(key)
            self.cache.store()
            self.topic_cache.delete(key)
            self.topic_cache.store()
            self.file_cache.delete(converted_file_title)
            self.file_cache.store()

            self.library_len = len(self.cache)
            logger.info(
                f"deling converting file_docs {converted_file_title} from library")
            return {"flag": 0, "result": [
                {"type": "text", "answer": speech_dict["del_success"]}]}

        else:
            logger.warning(
                f"but there is no file named:{converted_file_title} in library")
            return {"flag": -1,
                    "result": [{"type": "text",
                                "answer": speech_dict["del_failed"]}]}

    def _list(self):
        """
        返回所有db中的文件名
        """
        all_file_list = []
        for ft in self.file_cache:
            all_file_list.append(ft)
        self.library_len = len(self.cache)
        return all_file_list

    def list_files(self):
        """
        返回所有db中的文件名
        会校验下db的list跟doc_url下的list是否一致，不一致则会更新db
        """
        if self.library_len == 0:
            logger.info("empty library")
            return 1, speech_dict["empty_library"], ""

        all_file_list = self._list()
        logger.info(f"all files: {all_file_list}")
        return "\n".join(all_file_list)
