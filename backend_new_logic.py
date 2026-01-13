import uuid
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta

# 导入更名后的 AI 服务模块
from backend_llm_modelselect import AIService 

app = FastAPI()

# 允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 笔记总结请求模型
class NoteRequest(BaseModel):
    notes: str

# 模拟数据库结构
db = {
    "user": {
        "name": "Kristina",
        "avatar": "https://tse2.mm.bing.net/th/id/OIP.CfglGno9D-h16Lxp0Es47gHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
    },
    "notes": []
}

# 艾宾浩斯复习间隔（天）
REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30]

@app.get("/user/stats")
async def get_user_stats():
    """首页展示：获取用户信息和今日复习任务数"""
    today = datetime.now()
    due_notes = [n for n in db["notes"] if n["next_review_date"] <= today]
    return {
        "name": db["user"]["name"],
        "avatar": db["user"]["avatar"],
        "reviewCount": len(due_notes),
        "status": "success"
    }

@app.post("/process-file")
async def process_file(file: UploadFile = File(...)):
    """上传文件：AI 转录并存入复习数据库，初始化遗忘曲线"""
    try:
        # 调用 AI 服务进行转录
        ai_result = await AIService.process_multimodal_file(file)
        
        # 封装为带复习属性的笔记
        new_note = {
            "id": str(uuid.uuid4()),
            "title": ai_result["title"],
            "content": ai_result["text"],
            "created_at": datetime.now(),
            "next_review_date": datetime.now() + timedelta(days=REVIEW_INTERVALS[0]),
            "review_stage": 0
        }
        db["notes"].append(new_note)
        
        return {
            "text": new_note["content"], 
            "status": "success", 
            "note_id": new_note["id"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize")
async def summarize_notes(request: NoteRequest):
    """总结笔记：调用 GPT-4o 进行智能润色与总结"""
    if not request.notes.strip():
        return {"summary": "笔记内容为空"}
    try:
        summary = await AIService.summarize_with_gpt(request.notes)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # 启动应用
    uvicorn.run(app, host="0.0.0.0", port=8000)
