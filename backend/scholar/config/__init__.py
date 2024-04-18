import os
# import logging
import logging.config

import pnlp
# from apscheduler.schedulers.background import BackgroundScheduler


DEFAULT_ROOT = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__))))

CONFIG_FILE_PATH = os.path.join(
    DEFAULT_ROOT,
    "scholar",
    "config",
    "config.yaml")


MODEL_ROOT = os.path.join(DEFAULT_ROOT, "models")
USE_INFER_MODE = True

ROOT = os.environ.get("PROJECT_DIR", ".")
ROOT = os.path.join(ROOT, "scholar_output")

CACHE_ROOT = os.path.join(ROOT, "cache")
DOC_ROOT = os.path.join(ROOT, "library")
INDEX_ROOT = os.path.join(ROOT, "index")
WHOOSH_INDEX_DIR = os.path.join(INDEX_ROOT, "whoosh")
FAISS_INDEX_DIR = os.path.join(INDEX_ROOT, "faiss")
LOG_ROOT = os.path.join(ROOT, "logs")

for dirname in [
    CACHE_ROOT, DOC_ROOT, INDEX_ROOT, LOG_ROOT
]:
    pnlp.check_dir(dirname)

CONFIG = pnlp.read_yaml(CONFIG_FILE_PATH)
CONFIG["logger"]["handlers"]["info"]["filename"] = os.path.join(
    LOG_ROOT, "info.log")
CONFIG["logger"]["handlers"]["error"]["filename"] = os.path.join(
    LOG_ROOT, "error.log")

logging.config.dictConfig(CONFIG["logger"])

LOG_LEVEL = os.environ.get("LOG", "INFO")
if LOG_LEVEL == "DEBUG":
    logger_name = "main"
else:
    logger_name = __file__
logger = logging.getLogger(logger_name)


# scheduler = BackgroundScheduler()
# scheduler.start()
