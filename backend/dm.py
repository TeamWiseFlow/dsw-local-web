from config import *
from skills.penholder import penholder_chain, init_penholder_prompt
from skills.new_budget_analysis import analyze_budget
from skills.budget_analysis import *
from scholar import Scholar
from llms.chatglm2_wrapper import ChatGlm2Wrapper
from utils.get_logger import get_logger, DSW_LOG_KEY
import os, re
# from utils.paddlespeech import asr
from nlu import intent_predictor, gfw
import uuid
import time


analysis_success = '''2023年市本级全部部门共计采购266个品目，其中189个品目具有集中采购的潜力：
1.“软件开发”和“支撑软件开发”，共计8932万
      有40个部门有“软件开发”品目需求，总计4799万，66个部门有“支撑软件开发”品目需求，总计4133万，两个品目对应的供应商为同一类，建议合并后集中定点采买 
2. “物业管理”需求来自于285个部门，总计1亿8230万，建议定点几家进行集中购买

更多信息
'''

class DialogManager:
    def __init__(self, name: str = None, memory_len: int = 7777):
        self.name = name if name else 'DialogManager'
        self.project_dir = os.environ.get("PROJECT_DIR", ".")
        # 1. base initialization
        self.cache_url = os.path.join(self.project_dir, "cache")
        os.makedirs(self.cache_url, exist_ok=True)
        self.logger = get_logger(name=self.name, file=os.path.join(self.project_dir, f'{self.name}.log'))

        # 2. load the llm & Skills
        # self.llm = MossWrapper()
        if use_gpu:
            self.llm = ChatGlm2Wrapper()
            self.logger.info('LLM init success.')
        else:
            self.logger.info('use_gpu is False, no LLM')

        # 3. final initialization
        if os.environ.get(DSW_LOG_KEY, "").lower() == "verbose":
            self.verbose = True
        else:
            self.verbose = False

        self.loop = {}
        self.memory_len = memory_len
        self.scholar = Scholar(initial_file_dir=os.path.join(self.project_dir, "files"), use_gpu=use_gpu)

        # asr warm up
        # asr("tests/test.wav", punc=True)

        self.logger.info(f'DialogManager {self.name} init success.')

    @property
    def memory_length(self):
        return self.memory_len

    @memory_length.setter
    def memory_length(self, value):
        self.memory_len = value

    def initial_user_loop(self, user_id: str):
        self.loop[user_id] = {"status": "", "memory": [], "last_time": time.time()}

    def _run_panholder(self, query: str, user_id: str) -> dict:
        docx_name = os.path.join(self.cache_url, f"{str(uuid.uuid4())[:8]}.docx")
        self.logger.debug(f"penholder prompt: \n{query}")
        flag, msg = penholder_chain(prompt=query, file=docx_name, llm=self.llm, logger=self.logger, history=self.loop[user_id]["memory"])
        self.loop[user_id]["memory"].append([query])
        if flag < 0:
            # self.loop[user_id]["memory"].append(f"{moss_start}好的，请稍候。{moss_end}")
            self.loop[user_id]["memory"][-1].append("好的，请稍候。")
            return self.build_out(flag, speech_dict["others"])
        elif flag == 0:
            # self.loop[user_id]["memory"].append(f"{moss_start}{msg}{moss_end}")
            self.loop[user_id]["memory"][-1].append(msg)
            return self.build_out(flag, msg.replace("ChatGLM2-6B", avatar_name))
        elif flag == 11:
            del self.loop[user_id]
            return self.build_out(flag, msg)
        elif flag == 21:
            reply, result = msg.split("#####")
            # self.loop[user_id]["memory"].append(f"{moss_start}{result}{moss_end}")
            self.loop[user_id]["memory"][-1].append(result)
            replies = self.build_out(flag, reply.replace("ChatGLM2-6B", avatar_name))
            replies["result"].append({"type": "file", "answer": os.path.abspath(docx_name)})
            return replies
        else:
            # self.loop[user_id]["memory"].append(f"{moss_start}好的，请稍候。{moss_end}")
            self.loop[user_id]["memory"][-1].append("好的，请稍候。")
            self.logger.warning(f"penholder chain return unknown flag: {flag}")
            return self.build_out(flag, speech_dict["operation_failed"])

    def __call__(self, input: dict, **kwargs) -> dict:
        if input['type'] == 'text':
            query = input['content'].strip()
        elif input['type'] == 'voice':
            # query = asr(input['content'], punc=True)
            query = ""
            if not query:
                self.logger.warning(
                    f'voice asr failed: {input["content"]}, userid: {input["user_id"]}')
                return self.build_out(-3, speech_dict["asr_failed"])
        else:
            return self.build_out(-5, "wrong_input")

        user_id = input['user_id']

        # 预处理
        self.logger.debug(f"user: {user_id}, type: {input['type']}, query(raw): {query}")
        query = query.replace(avatar_name, "").replace(avatar_name.lower(), "").replace(avatar_name.upper(), "").replace(avatar_name.capitalize(), "").strip()

        if query == "#ding" or query == "#help":
            return self.build_out(0, speech_dict["help"])

        gfw_result = gfw.filter(query)
        if gfw_result:
            self.logger.warning(f"query: {query} is blocked by gfw")
            return self.build_out(0, speech_dict["gfw"])

        # 去除所有表情符号
        query = re.sub(r'\[[^]]{1,4}]', '', query)
        emoji_pattern = re.compile("["
                                   u"\U0001F600-\U0001F64F"  # emoticons
                                   u"\U0001F300-\U0001F5FF"  # symbols & pictographs
                                   u"\U0001F680-\U0001F6FF"  # transport & map symbols
                                   u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
                                   "]+", flags=re.UNICODE)
        query = emoji_pattern.sub(r'', query)

        self.logger.info(f"【{user_id}】{query}")

        # 主流程
        self.logger.debug(f"user: {user_id}, type: {input['type']}, query(after process): {query}")

        # 判断技能符
        if query.startswith("#") or query.startswith("＃"):
            self.initial_user_loop(user_id)
            # todo：we need a text_classifier here to do the intent judgement--use llm
            self.loop[user_id]["status"] = "penholder"
            penholder_text = init_penholder_prompt(query[1:])
            # self.loop[user_id]["memory"].append(penholder_text)
            # return self._run_panholder("".join(self.loop[user_id]["memory"]), user_id)
            return self._run_panholder(penholder_text, user_id)

        # 任何时候？或者?开头自然退出所有状态
        if query.startswith("?") or query.startswith("？"):
            if user_id in self.loop:
                del self.loop[user_id]
            if len(query) == 1:
                return self.build_out(0, "已切换至默认状态，知识库查找请直接输入问题。")
            query = query[1:]

        # 判断是否在状态流程中
        if user_id in self.loop:
            if time.time() - self.loop[user_id]["last_time"] > 600:
                del self.loop[user_id]
            else:
                self.loop[user_id]["last_time"] = time.time()
                lens = 0
                for strs in self.loop[user_id]["memory"]:
                    lens += len("".join(strs))
                if lens > self.memory_len:
                    self.loop[user_id]["memory"].pop(1)
        else:
            # 简单意图判断
            if len(query) < 10:
                intents = intent_predictor.predict(query)
                if intents:
                    intent = intents[0]
                    self.logger.debug(f"user input intent: {intent}")
                    if intent in ["greeting", "dissatisfied", "bye", "praise", "meaningless"]:
                        return self.build_out(0, speech_dict[intent])

        user_status = self.loop[user_id]["status"] if user_id in self.loop else None
        # todo: 复杂意图判断——流程结束 use llm

        # 优先判断状态流程，并直接进入状态流程
        if user_status == "penholder":
            # self.loop[user_id]["memory"].append(f"{human_start}{query}{human_end}")
            # self.loop[user_id]["memory"].append(query)
            # return self._run_panholder("".join(self.loop[user_id]["memory"]), user_id)
            return self._run_panholder(query, user_id)
        res = self.scholar.ask(query)
        self.logger.debug(res)
        return res

    def build_out(self, flag: int, answer: str = "") -> dict:
        """
        tts and playlist generating
        按开发约定生成返回格式
        Project Dir在run.sh中通过环境变量设定。
        如果project dir里面包含playlist文件夹，且不为空，则返回带素材播放列表的结果

        如果环境变量中设定了NEED_VOICE，且值为 male或者female，则会合成语音
        
        answer_voice = None
        if self.need_voice and answer:
            if len(answer) > 100:
                script = answer.split("：\n\n")[0]
            else:
                script = answer

            # timestmp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
            answer_voice = os.path.join(self.cache_url, f"{str(uuid.uuid4())[:8]}_answer.wav")
            try:
                self.tts(script, answer_voice)
            except Exception as e:
                flag = -2
                self.logger.warning(f"answer tts failed!---{e}")

        playlist = []
        if self.need_play_list and answer_voice:
            try:
                answer_voice_length = max(
                    2, get_sound_file_length(answer_voice))
                playlist = [
                    generate_playlist(
                        answer_voice_length,
                        self.play_list_dir)]
            except Exception as e:
                flag = -1
                self.logger.warning(f"generate playlist failed!---{e}")
        """
        return {"flag": flag, "result": [{"type": "text", "answer": answer}]}
    
    def add_file(self, input: dict) -> dict:
        if input['type'] != 'file':
            return self.build_out(-5, "wrong_input")
        user_id = input['user_id']
        query = input['content'].strip()
        addition = input.get('addition', "")
        self.logger.info(f"user: {user_id} apply to add file to index:\n{query}, addition_name:{addition}")
        res = self.scholar.add_file(file=query, name=addition)
        self.logger.debug(res)
        return res
    
    def del_file(self, input: dict) -> dict:
        if input['type'] != 'file':
            return self.build_out(-5, "wrong_input")
        user_id = input['user_id']
        query = input['content']
        self.logger.info(f"user: {user_id} apply to del file index:\n{query}")
        res = self.scholar.del_file(query)
        self.logger.debug(res)
        return res
    
    def run_budget_analysis(self, input: dict) -> dict:
        if input['type'] != 'file':
            return self.build_out(-5, "wrong_input")
        user_id = input['user_id']
        query = input['content'].strip()
        self.logger.info(f"user: {user_id} apply to new budget analysis, source file:\n{query}")
        output_file = os.path.join(self.cache_url, f"{str(uuid.uuid4())[:8]}.xlsx")
        try:
            analyze_budget(input_file=query, output_file=output_file)
            replies = self.build_out(21, analysis_success)
            replies["result"].append({"type": "file", "answer": output_file})
            self.logger.debug(replies)
            return replies
        except Exception as e:
            self.logger.warning(f"budget analysis failed!---{e}")
            return self.build_out(-2, "new budget analysis failed")

    def old_budget_analysis(self, files: list) -> dict:
        self.logger.debug(f"apply to old budget analysis, source files:\n{files}")
        if not files:
            return self.build_out(1, "empty input")

        data_sheet1 = []
        data_sheet2 = []
        data_sheet3 = []
        for file in files:
            data_s1, data_s2, data_s3 = read_excel(file)
            if data_s1 is not None:
                data_sheet1.extend(data_s1)
            if data_s2 is not None:
                data_sheet2.extend(data_s2)
            if data_s3 is not None:
                data_sheet3.extend(data_s3)

        if data_sheet1:
            data_sheet1 = pd.concat(data_sheet1, ignore_index=True)
            result_sheet1 = compare_data1(data_sheet1)
        else:
            result_sheet1 = {}
        if data_sheet2:
            data_sheet2 = pd.concat(data_sheet2, ignore_index=True)
            result_sheet2 = compare_data2(data_sheet2)
        else:
            result_sheet2 = {}
        if data_sheet3:
            data_sheet3 = pd.concat(data_sheet3, ignore_index=True)
            result_sheet3 = compare_data3(data_sheet3)
        else:
            result_sheet3 = {}

        if not result_sheet1 and not result_sheet2 and not result_sheet3:
            return self.build_out(1, "none excel file right")

        output_file = os.path.join(self.cache_url, f"{str(uuid.uuid4())[:8]}.xlsx")
        try:
            save_result(result_sheet1, result_sheet2, result_sheet3, output_file)
            replies = self.build_out(21, "分析成功")
            self.logger.debug(replies)
            replies["result"].append({"type": "file", "answer": output_file})
            return replies
        except Exception as e:
            self.logger.warning(f"budget analysis failed!---{e}")
            return self.build_out(-2, "new budget analysis failed")


if __name__ == "__main__":
    from pprint import pprint

    # os.environ["PROJECT_DIR"] = "DSWtest"
    # os.environ[DSW_LOG_KEY] = "verbose"
    agent = DialogManager()

    while True:
        user_input = input("> ")
        if user_input.lower() == "exit":
            break
        if user_input.lower() == "clear":
            agent.loop = {}
            continue

        start = time.time()
        try:
            print("---------------------------")
            pprint(agent({"user_id": "test", "type": "text", "content": user_input}))
        except Exception as e:
            print("Error:", e)

        end = time.time()
        print(f"Cost: {end - start} seconds")
