export PROJECT_DIR="shaoxing"
export PROFILE="prod"
export DSW_LOG="verbose"

uvicorn main:app --reload --host 127.0.0.1 --port 7777