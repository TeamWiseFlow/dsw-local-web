from typing import List
import os

import sys
from os.path import abspath, join, dirname

root = dirname(dirname(abspath(__file__)))
sys.path.append(root)


ENV = os.environ.get("PROFILE", "dev")
print("ENV: ", ENV)


class LlmServer:

    def __init__(
        self,
    ):
        self.host = ZhipuAIWrapper()

    def run(
        self,
        prompt: str,
        max_length: int = 8192,
        top_p: float = 0.8,
        temperature: float = 0.2,
    ) -> str:

        resp = self.host(prompt=prompt, top_p=top_p, temperature=temperature)
        result = resp[0]
        for i in range(5):
            if result and not result.startswith("!!!_"):
                break
            print(f"LLM wrong\nprompt:{prompt}\nresponse:{resp}\n{i} time retrying...")
            resp = self.host(prompt=prompt, top_p=top_p, temperature=temperature)
            result = resp[0]
        return result

    def generate_q(self, cxt: str) -> List[str]:
        if ENV == "dev":
            return [
                "llm generated q1",
            ]

        prompt = f"""你现在是一名老师，你需要为你的学生出一些考试题目，以考验他们对下面文件内容的掌握程度：
{cxt}

请只给出题目，不要任何解释和注释，也无需编号。回答应遵循如下格式：
题目：（你给出的第一个题目）
题目：（你给出的第二个题目）
……"""

        qs = self.run(prompt)
        res = []
        for q in qs.split("题目："):
            q = q.strip()
            if len(q) < 5:
                continue
            res.append(q)
        return res

    def generate_abstract(self, cxt: str) -> str:
        if ENV == "dev":
            return "llm generated abstract"
        prompt = f"为下面的文本内容提取一句话主旨：\n{cxt}\n\n一句话主旨："
        resp = self.run(prompt)
        return resp
