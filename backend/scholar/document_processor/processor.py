from typing import List, Dict, Tuple, Union, Literal
from pathlib import Path
import re
import logging
import pnlp


logger = logging.getLogger("document_processor")


one_to_ten_zh = "一二三四五六七八九十"


zh_first_head_regex = re.compile(
    rf"""
    ^第?[{one_to_ten_zh}]+章?[.、 ]
    """, re.UNICODE | re.VERBOSE
)
zh_second_head_regex = re.compile(
    rf"""
    ^[(（第][{one_to_ten_zh}]+[)）条（]
    """, re.UNICODE | re.VERBOSE
)
ara_first_head_regex = re.compile(
    r"""
    ^\d+[. 、]
    """, re.UNICODE | re.VERBOSE
)
ara_second_head_regex = re.compile(
    r"""
    ^[（(]\d+[）)]
    |
    ^\d+[.]\d+
    """, re.UNICODE | re.VERBOSE
)

HEAD_REGEX = {
    "zh_first": zh_first_head_regex,
    "zh_second": zh_second_head_regex,
    "ara_first": ara_first_head_regex,
    "ara_second": ara_second_head_regex,
    "za_first": zh_first_head_regex,
    "za_second": ara_second_head_regex,
}


zh_head_regex = re.compile(
    rf"""
    ^第?[{one_to_ten_zh}]+[章条]?[.、 （]
    |
    ^[(（][{one_to_ten_zh}]+[)）]
    """, re.UNICODE | re.VERBOSE
)
ara_head_regex = re.compile(
    r"""
    ^\d[. 、]
    |
    ^[（(]\d+[）)]
    |
    ^\d+[.]\d+
    """, re.UNICODE | re.VERBOSE
)
za_head_regex = re.compile(
    rf"""
    ^[{one_to_ten_zh}]+[.、]
    |
    ^\d[. ]\d?
    """, re.UNICODE | re.VERBOSE
)

HEAD_TYPE_REGEX = {
    "zh": zh_head_regex,
    "ara": ara_head_regex,
    "za": za_head_regex,
}


class TextProcessor:

    def __init__(self, llm=None, len_thresh: int = 15):
        self.len_thresh = len_thresh
        self.enter_head_regex = re.compile(r"[\n\u3000]+")
        self.attachment_regex = re.compile(r"附件[:：]")
        self.para_regex = re.compile(
            r"[\n\u3000]{2,}",
            re.VERBOSE | re.UNICODE
        )
        self.page_sign_regex = re.compile(r"-\s*\d+\s*-")
        self.faq_tag_regex = re.compile("答[:：]")

        self.colon_regex = re.compile(r"[:：]")
        self.guide_tag_regex = re.compile(
            r"""
            \|>问题>\|
            |
            \|>>片段\d*>>\|
            """, re.UNICODE | re.VERBOSE
        )

        self.reg_splitter = re.compile(r"[-]{5,}")
        self.reg_doc_splitter = re.compile("浙财.+号")
        self.llm_ins = llm

    def clean_doc(self, text: str) -> str:
        text = text.strip()
        text = self.page_sign_regex.sub("", text)
        return text

    def clean(self, text: str) -> str:
        text = text.strip()
        return text

    def strip_colon(self, text: str) -> str:
        text = text.strip(":")
        text = text.strip("：")
        return text

    def is_head(self, s: str, head_type: str) -> bool:
        if head_type not in HEAD_TYPE_REGEX:
            return False
        regex = HEAD_TYPE_REGEX[head_type]
        if regex.search(s):
            return True
        return False

    def preprocess(self, s: str) -> str:
        s = s.replace("\t", " ")
        return s

    def build_doc_out(
        self,
        lst: List[List[str]],
        head_type: str,
        file_title: str,
        heads: List[str],
    ) -> List[Tuple[str, str]]:
        # 其实只有两种一级标题：中文或数字，或者没标题
        if head_type:
            first_head_regex: re.Pattern = HEAD_REGEX[head_type + "_first"]
            second_head_regex: re.Pattern = HEAD_REGEX[head_type + "_second"]
        no_head = True
        is_splited = True
        for im in lst:
            s0 = im[0]
            if head_type and HEAD_TYPE_REGEX[head_type].search(s0):
                no_head = False
                break
        if no_head:
            is_splited = False
            # NOTE: 非标题都不要回车
            conts = ["\n".join(v).replace("\n", "") for v in lst]
            if not conts:
                return []
            cxt = "\n\n".join(conts)
            return_cxt = file_title + "\n\n" + \
                cxt + "\n\n" + f"（摘自：{file_title}）"
            res = []
            if self.llm_ins is not None:
                q = self.llm_ins.generate_abstract(cxt)
                res.append((q, return_cxt, is_splited))
            res.append((cxt, return_cxt, is_splited))
            return res

        res = []
        for im in lst:
            if len(im) <= 1:
                continue
            s0 = im[0]
            if not (
                first_head_regex.search(s0) or
                second_head_regex.search(s0)
            ):
                continue
            curr_qas = self.build_q_and_cxt_with_heads(
                im, heads, file_title, head_type)
            res.extend(curr_qas)
            # if len(im) > 1 and head_type and second_head_regex.search(im[1]):
            # res.append((im[1], return_cont, is_splited))
            # elif head_type and first_head_regex.search(s0):
            # res.append((s0, return_cont, is_splited))
            # else:
            # # NOTE: 只要有标题部分
            # pass
        return res

    def build_q_and_cxt_with_heads(
        self,
        ps: List[str],
        heads: List[str],
        file_title: str,
        head_type
    ):
        res = []
        curr_head = ps[0]
        # NOTE: 不要回车
        cont = "".join(ps)

        # 构造所有标题
        ans_list = []
        for s in heads:
            break
            if s == curr_head:
                ans_list.append(cont)
            else:
                ans_list.append(s)
                ans_list.append("..." * 10)
        # ans = "\n".join(ans_list)
        # ans = file_title + "\n\n" + ans

        ans = cont + f"\n\n（摘自：{file_title}...{curr_head}）"
        parent = self.find_parent(heads, curr_head, head_type)
        q = parent + " " + curr_head
        res.append((q, ans, True))
        res.append((cont, ans, True))
        if self.llm_ins is not None:
            qs = self.llm_ins.generate_q(cont)
            for q in qs:
                res.append((q, ans, True))
        return res

    def find_parent(
        self,
        heads: List[str],
        curr_head: str,
        head_type: str,
    ) -> str:
        # here every ele of heads is `head`
        first_head_regex: re.Pattern = HEAD_REGEX[head_type + "_first"]
        if first_head_regex.search(curr_head):
            return ""
        find = False
        for i, head in enumerate(heads):
            if head == curr_head:
                find = True
                break
        if find:
            while i > 0:
                i -= 1
                if first_head_regex.search(heads[i]):
                    return heads[i]
        return ""

    def add_first_head(
        self, lst: List[List[str]], head_type: str
    ) -> List[str]:
        # 其实只有两种一级标题：中文或数字，或者没标题
        if head_type:
            first_head_regex: re.Pattern = HEAD_REGEX[head_type + "_first"]
            second_head_regex: re.Pattern = HEAD_REGEX[head_type + "_second"]
        res = []
        prefix = []
        for i, im in enumerate(lst):
            s = im[0]
            if head_type and second_head_regex.search(s):
                k = i
                while k > 0:
                    k -= 1
                    prev = lst[k]
                    if head_type and first_head_regex.search(prev[0]):
                        prefix = prev[:1]
                        break
                im = prefix + im
                res.append(im)
                prefix = []
            else:
                if head_type and first_head_regex.search(s) and len(im) == 1:
                    continue
                res.append(im)
        return res

    def split_doc_text_to_list(
        self, text: str, head_type: str
    ) -> List[List[str]]:
        res = []
        heads = []
        main_body_text = self.attachment_regex.split(text)[0]
        part_lst = self.para_regex.split(main_body_text)
        for part in part_lst:
            part = self.clean_doc(part)
            lst = self.enter_head_regex.split(part)
            tmp = []
            i = 0
            while i < len(lst):
                curr = lst[i]
                curr = self.clean_doc(curr)
                i += 1
                if not pnlp.reg.pchi.search(curr):
                    continue
                if self.is_head(curr, head_type):
                    heads.append(curr)
                    if tmp:
                        res.append(tmp)
                        tmp = []
                tmp.append(curr)
            if tmp:
                res.append(tmp)
        return res, heads

    def read_doc_file_to_list(
        self,
        file_path: str,
        file_title: str,
    ) -> List[str]:
        raw_text = pnlp.read_file(file_path)
        texts = self.reg_doc_splitter.split(raw_text)
        res = []
        for text in texts:
            clean_text = self.clean_doc(text)
            lst = self.enter_head_regex.split(clean_text)
            head_type = self.guess_head_type(lst)

            split_lst, heads = self.split_doc_text_to_list(text, head_type)
            # added_head_lst = self.add_first_head(split_lst, head_type)
            part_res = self.build_doc_out(split_lst, head_type, file_title, heads)
            res.extend(part_res)
        return res

    def read_faq_file_to_list(
        self,
        file_path: str,
        file_title: str,
    ) -> List[str]:
        res = []
        tmp = []
        for line in pnlp.read_lines(file_path):
            if line.startswith("答"):
                tmp.append(line)
                res.append(" ".join(tmp))
                tmp = []
            else:
                tmp.append(line)
        return res

    def read_guide_file_to_list(
        self,
        file_path: str,
        file_title: str,
    ) -> List[Tuple[str, str, str, bool]]:
        text = pnlp.read_file(file_path)
        # path = Path(file_path)
        lst = self.reg_splitter.split(text)
        data = [v.strip() for v in lst if v]
        res = []
        for topic_text in data:
            topic_list = self.guide_tag_regex.split(topic_text)
            clean_list = [v for v in topic_list if v]
            if not clean_list:
                continue
            topic = clean_list[0].strip()
            topic_cont_list = clean_list[1:]
            res.append((topic, topic, "\n".join(topic_cont_list), True))
            for cont in topic_cont_list:
                tmp = self.colon_regex.split(cont)
                sub_topic = tmp[0]
                question = topic + sub_topic
                answer = "".join(tmp[1:]).strip()
                res.append((topic, question, answer, False))
        return res

    def read_std_file_to_list(
        self,
        file_path: str,
        file_title: str
    ) -> List[Dict]:
        lst = pnlp.read_file_to_list_dict(file_path)
        return lst

    def read_template_file_to_list(
        self,
        file_path: str,
        file_title: str
    ) -> List[str]:
        res = []
        tmp = []
        lines = pnlp.read_lines(file_path)
        topic = lines[0].strip()[3:]
        others = lines[1:]
        first = True
        for line in others:
            if line.startswith("问题Q"):
                if first:
                    tmp.append(line)
                if not first:
                    res.append("\n".join(tmp))
                    tmp = [line]
                first = False
            else:
                tmp.append(line)
        if tmp:
            res.append("\n".join(tmp))
        out = [(topic, topic, "\n".join(others), True)]
        for v in res:
            tmp = v.strip().split("\n")
            q = tmp[0].strip()[4:]
            a = "\n".join(tmp[1:]).strip()[4:]
            out.append((topic, q, a, False))
        return out

    def read_file_doc_content_to_list(
        self,
        file_path: str,
        file_title: str
    ) -> List[str]:
        # NOTE: use content
        res = [file_title]
        text = pnlp.read_file(file_path)
        clean_text = self.clean_doc(text)
        lst = self.enter_head_regex.split(clean_text)
        res.extend(lst)
        return res

    def read_file_doc_title_to_list(
        self,
        file_path: str,
        file_title: str
    ) -> List[str]:
        # NOTE: use title and filename
        res = [file_title]
        text = pnlp.read_file(file_path)
        clean_text = self.clean_doc(text)
        lst = self.enter_head_regex.split(clean_text)
        head_type = self.guess_head_type(lst)
        _, heads = self.split_doc_text_to_list(text, head_type)
        res.extend(heads)
        return res

    def read_file_doc_filename_to_list(
        self,
        file_path: str,
        file_title: str
    ) -> List[str]:
        # NOTE: use filename only
        return [file_title]

    def _count_heads(self, lst: List[str]) -> Dict[str, int]:
        count = {
            "zh_first": 0,
            "zh_second": 0,
            "ara_first": 0,
            "ara_second": 0,
        }
        for p in lst:
            for re_name in count:
                re_exp = HEAD_REGEX[re_name]
                find = re_exp.search(p)
                if find:
                    count[re_name] += 1
                    break
        return pnlp.MagicDict(count)

    def guess_head_type(self, lst: List[str]) -> str:
        cd = self._count_heads(lst)
        # 一个一级标题+一个二级标题
        if cd.zh_first >= 1 and cd.zh_second >= 1:
            return "zh"
        if cd.zh_first >= 1 and cd.ara_first >= 1:
            return "za"
        if cd.ara_first >= 1 and cd.ara_second >= 1:
            return "ara"
        # 一个一级标题也行
        if cd.zh_first >= 1:
            return "zh"
        if cd.ara_first >= 1:
            return "ara"
        return ""

    def guess_file_cont_type(self, file_path: Union[str, Path]) -> str:
        file_path = str(file_path)
        if file_path.endswith(".json"):
            return "std"
        f_count = 0
        g_count = 0
        t_count = 0  # templete
        lines = pnlp.read_lines(file_path, count=100)
        for line in lines:
            if line.startswith("问题Q"):
                t_count += 1
            if line.startswith("答案A"):
                t_count += 1
            if line.startswith("答"):
                f_count += 1
            if self.reg_splitter.search(line):
                g_count += 1
        if t_count > 1:
            return "template"
        # 至少出现2次，认为该文档为FAQ文档
        if f_count > 1:
            return "faq"
        if g_count > 0:
            return "guide"
        return "doc"

    def guess_parse_type(self, file_cont_type: str, file_type: str) -> str:
        if file_cont_type in ["std", "template"]:
            return "doc_qa"
        if file_type in ["html", "pdf", "docx", "doc", "xls", "xlsx"]:
            return "doc_title"
        elif file_type in ["txt"]:
            return "doc_content"
        else:
            # ppt, pptx, png, jpeg, etc...
            return "doc_filename"

    def parse_text_file_4fs(
        self,
        file_path: str,
        file_type: str,
        file_name: str,
        file_title: str,
        parse_type: str = Literal["doc_title", "doc_filename"],
    ):
        func = getattr(self, f"read_file_{parse_type}_to_list")
        lst = func(file_path, file_title)
        res = self._parse_file_index_list(
            file_type, file_name, file_title, lst)
        return res

    def _parse_file_index_list(
        self,
        file_type: str,
        file_name: str,
        file_title: str,
        lst: List[str]
    ):
        res = []
        for item in lst:
            content = self.preprocess(item)
            im = {
                "file_name": file_name,
                "file_title": file_title,
                "file_type": file_type,
                "file_cont_type": "doc",
                "uuid": pnlp.generate_uuid(file_name, content),
                "topic": "",
                "content": content,
                "answer": file_name,
                "need_cache_topic": False,
                "is_splited": True,
                "index_type": "file",
            }
            res.append(im)
        return res

    def parse_text_file_4qa(
        self,
        file_path: str,
        file_type: str,
        file_name: str,
        file_title: str,
        file_cont_type: str = Literal["doc", "faq", "guide", "std", "template"],
    ) -> List[Dict]:
        return self.parse_text_file(
            file_path, file_type, file_name, file_title, file_cont_type
        )

    def parse_text_file(
        self,
        file_path: str,
        file_type: str,
        file_name: str,
        file_title: str,
        file_cont_type: str = Literal["doc", "faq", "guide", "std", "template"],

    ) -> List[Dict]:
        """
        @ file_path: 转换后的txt的路径
        @ file_type: 文件类型
        @ file_name: 最原始的文件名
        @ file_title: 文件标题（图像、链接这个会不一样）
        """
        msg = f"Parsing file: file type of {file_path}: {file_type} {file_cont_type}"
        logger.info(msg)
        if file_cont_type is None:
            file_cont_type = self.guess_file_cont_type(file_path)
        func = getattr(self, f"read_{file_cont_type}_file_to_list")
        lst = func(file_path, file_title)
        res = self._parse_text_list(
            file_type, file_name, file_title, file_cont_type, lst)
        # faq额外增加q为question，a为content的索引
        # if file_cont_type == "faq":
        # res += self._parse_text_list("faq", fn, lst)
        return res

    def _parse_text_list(
        self,
        file_type: str,
        file_name: str,
        file_title: str,
        file_cont_type: str,
        lst: List[str]
    ) -> List[Dict]:
        res = []
        need_cache_topic = False
        is_splited = True
        for item in lst:
            if file_cont_type == "faq":
                tmp = self.faq_tag_regex.split(item)
                if len(tmp) != 2:
                    msg = f"{self} parse_text_list: {item} can not be treated as a faq"
                    logger.warning(msg)
                    continue
                cont, ans = tmp
                ans = self.strip_colon(ans)
                topic = ""
            elif file_cont_type == "doc":
                cont, ans, is_splited = item
                topic = ""
            elif file_cont_type == "guide":
                topic, cont, ans, need_cache_topic = item
            elif file_cont_type == "std":
                topic = item["topic"]
                cont = item["content"]
                ans = item["answer"]
                need_cache_topic = item["need_cache_topic"]
            elif file_cont_type == "template":
                topic, cont, ans, need_cache_topic = item
            else:
                msg = f"{self} parse_text_list: invalid file type: {file_cont_type}"
                logger.warning(msg)
                continue

            content = self.preprocess(cont)

            # only `doc` do the filter
            # if file_cont_type == "doc" and len(content) < self.len_thresh:
            # continue
            im = {
                "file_name": file_name,
                "file_title": file_title,
                "file_type": file_type,
                "file_cont_type": file_cont_type,
                "uuid": pnlp.generate_uuid(file_name, content),
                "topic": topic,
                "content": content,
                "answer": ans,
                "need_cache_topic": need_cache_topic,
                "is_splited": is_splited,
                "index_type": "qa",
            }
            res.append(im)
        return res


def main():
    import argparse
    from os.path import join
    from converter import PDFReader, ExcelReader
    import sys
    sys.path.append("../")
    from llm import LlmServer

    parser = argparse.ArgumentParser(
        description="python processor.py -f /path/to/file.pdf"
    )
    parser.add_argument("-f", dest="file", type=str, help="file")
    parser.add_argument("-d", dest="file_dir", type=str, help="dir")
    args = parser.parse_args()

    excelreader = ExcelReader()
    pdfreader = PDFReader()
    llm_server = LlmServer()
    tp = TextProcessor(llm_server)

    tmp_path = "./tmp/"
    pnlp.check_dir(tmp_path)

    def file4index(file_path: str):
        print(f"Processing file: {file_path}")
        raw_file = Path(file_path)
        # 原始文件信息
        file_type = raw_file.suffix[1:]
        file_name = raw_file.name

        # 转文本
        if file_type == "pdf":
            text_file_name = pdfreader.convert(raw_file.as_posix(), tmp_path)
        elif file_type in ["xls", "xlsx"]:
            text_file_name = excelreader.convert(raw_file.as_posix(), tmp_path)
        text_file_path = join(tmp_path, text_file_name)

        # 转换后文件信息
        # NOTE: 图片的file_title不一定等于file_name，所以需要额外一个字段
        converted_file_title = Path(text_file_path).stem
        # 用来区分如何拆分文档
        file_cont_type = tp.guess_file_cont_type(text_file_path)

        if file_type == "pdf":
            docs = tp.parse_text_file_4qa(
                text_file_path,
                file_type,
                file_name,
                converted_file_title,
                file_cont_type,
            )
        elif file_type in ["xls", "xlsx"]:
            docs = tp.parse_text_file_4fs(
                text_file_path,
                file_type,
                file_name,
                converted_file_title,
                "doc_title",
            )
        pnlp.write_list_dict_to_file(converted_file_title + ".json", docs)
        print("done")

    if args.file:
        file4index(args.file)
    elif args.file_dir:
        for file_path in Path(args.file_dir).glob("*"):
            file4index(file_path.as_posix())
    else:
        msg = "python processor.py -f /path/to/file.pdf"
        raise ValueError(msg)


if __name__ == "__main__":
    main()
