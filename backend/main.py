from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from dm import DialogManager
from typing import Dict, Literal, Optional
from fastapi.middleware.cors import CORSMiddleware

dm = DialogManager()


class Request(BaseModel):
    """
    Input model
    遵循midplatform统一入参格式
    input = {“user_id”:”xxx”, “type”:”text”, 'content':str， 'addition': Optional[str]}
    type限定为text、voice和file（含图片、视频文件，中台通过文件后缀名判断处理）；

    注意：1、add_file 和 del_file, type 只能是 file； ask 接口type 为text或者voice，不然会返回 -5 wrong input；
         2、add_file content里面要写绝对路径，但是del_file 这里仅写文件名！
         3、add_file 如果需要指定file的额外信息（比如原始中文文件名，可以通过addition参数给出
    """
    user_id: str
    type: Literal["text", "voice", "file"]
    content: str
    addition: Optional[str] = None
        

class ScholarThreshRequest(BaseModel):
    """
    Scholar Threshold Reqest body.

    Parameters
    -----------
    ranker_topn: 排序topN，默认3，不超过20
    ranker_low_threshold: 排序低阈值，默认0.5，0-1
    ranker_high_threshold: 排序高阈值，默认0.85，0-1
    """
    ranker_topn: Optional[int] = None
    ranker_high_threshold: Optional[float] = None
    ranker_low_threshold: Optional[float] = None


class DMThreshRequest(BaseModel):
    memory_length: Optional[int] = None


class Budget2022(BaseModel):
    files: List[str]


app = FastAPI(
    title="DSW MidPlatform Backend",
    description="From DSW Team.",
    version="0.0.9",
    openapi_url="/openapi.json"
)

app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.get("/")
async def read_root():
    msg = "Hello, this is DSW"
    return {"msg": msg}


@app.post("/dm")
async def call(request: Request) -> Dict:
    return dm(request.dict())


@app.post("/ScholarThreshold")
async def set_scholar_threshold(request: ScholarThreshRequest) -> Dict:
    for key, val in request.dict().items():
        if val is None:
            continue
        if key.endswith("topn") and (val > 20 or val <= 0):
            return {"flag": -1, 'result': [{"type": "text", "answer": "topn should not greater than 20."}]}
        if key.endswith("threshold") and (val <= 0 or val >= 1):
            return {"flag": -1, 'result': [{"type": "text", "answer": "threshold should between 0 and 1."}]}
        setattr(dm.scholar, key, val)
    return {'flag': 0, 'result': [{"type": "text", "answer": "success"}]}


@app.post("/DMThreshold")
async def set_dm_threshold(request: DMThreshRequest) -> Dict:
    for key, val in request.dict().items():
        if val is None:
            continue
        if key.endswith("length") and (val > 5000 or val <= 0):
            return {"flag": -1, 'result': [{"type": "text", "answer": "memory length should not greater than 5000."}]}
        setattr(dm, key, val)
    return {'flag': 0, 'result': [{"type": "text", "answer": "success"}]}


@app.post("/add_file")
async def add_file(request: Request) -> Dict:
    return dm.add_file(request.dict())

@app.post("/del_file")
async def add_file(request: Request) -> Dict:
    return dm.del_file(request.dict())

@app.post("/new_budget_analysis")
async def budget_analysis(request: Request) -> Dict:
    return dm.run_budget_analysis(request.dict())

@app.post("/2022_budget_analysis")
async def budget_analysis2022(request: Budget2022) -> Dict:
    files = request.dict()["files"]
    return dm.old_budget_analysis(files)
