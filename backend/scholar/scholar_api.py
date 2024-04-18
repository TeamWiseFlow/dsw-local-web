import os
from typing import Dict, Literal, Optional
from fastapi import APIRouter
from pydantic import BaseModel


from .scholar import Scholar


project_dir = os.environ.get("PROJECT_DIR", "")
files_path = os.path.join(project_dir, 'files')
playlist_path = os.path.join(project_dir, 'playlist')


scholar = Scholar(
    initial_file_dir=files_path,
    # need_filename=True,
    # pre_filename="根据",
    )


router = APIRouter()


class ScholarRequest(BaseModel):
    """
    Input model
    遵循midplatform统一入参格式
    {“user_id”:”xxx”, “type”:”text”, 'content':str}，type限定为text、voice、img、video和file五个值
    type为voice或者file时，content写文件的相对路径（前端程序将与与midplatform部署在同一个目录下）
    如input={"user_id":"wxid_2343443","type":"voice","content":"./audio.wav"}
    """
    user_id: str
    type: Literal["text", "voice", "img", "voice", "file"]
    content: str


class ThreshRequest(BaseModel):
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


@router.post("/ask")
async def scholar_ask(request: ScholarRequest) -> Dict:
    return scholar.ask(request.dict())


@router.post("/setThreshold")
async def set_scholar_threshold(request: ThreshRequest) -> Dict:
    for key, val in request.dict().items():
        if val is None:
            continue
        if key.endswith("topn") and (val > 20 or val <= 0):
            return {"flag": -1, "msg": "topn should not greater than 20."}
        if key.endswith("threshold") and (val <= 0 or val >= 1):
            return {"flag": -1, "msg": "threshold should between 0 and 1."}
        setattr(scholar, key, val)
    return {'flag': -4, 'contents': [{"text": "suceess", "voice": ""}], 'play_list': []}


@router.get("/list")
async def list_files() -> Dict:
    return scholar.list_files()


@router.post("/add")
async def add_file(request: ScholarRequest) -> Dict:
    return scholar.add_file(request.dict())


@router.post("/delete")
async def delete_file(request: ScholarRequest) -> Dict:
    return scholar.del_file(request.dict())
