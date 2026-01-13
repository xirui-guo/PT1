import os
import openai
from fastapi import UploadFile
from dotenv import load_dotenv

# 加载环境变量 (确保本地有 .env 文件)
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

class AIService:
    """
    专门负责多模态文件处理与 OpenAI 接口调用的服务类
    """
    
    @staticmethod
    async def process_multimodal_file(file: UploadFile):
        """
        处理上传的文件：
        1. 音视频 -> 调用 Whisper 转文字
        2. 文档 (TXT) -> 读取文本
        """
        file_extension = file.filename.split(".")[-1].lower()
        temp_file = f"temp_{file.filename}"
        
        try:
            # 保存临时文件以便 OpenAI 读取
            with open(temp_file, "wb") as buffer:
                buffer.write(await file.read())

            result_text = ""

            # 逻辑 A: 音视频处理 (Whisper)
            if file_extension in ["mp3", "mp4", "wav", "m4a"]:
                with open(temp_file, "rb") as audio_file:
                    # 使用旧版 openai 库语法 (如需更新至 v1.0+ 请告知)
                    transcript = openai.Audio.transcribe("whisper-1", audio_file)
                    result_text = transcript["text"]
            
            # 逻辑 B: 简单文本处理
            elif file_extension == "txt":
                with open(temp_file, "r", encoding="utf-8") as f:
                    result_text = f.read()
            
            else:
                result_text = f"已识别文件 {file.filename}，但目前仅支持音视频转写和 TXT 读取。"

            return {
                "title": file.filename,
                "text": result_text
            }

        except Exception as e:
            raise Exception(f"AI 服务端处理失败: {str(e)}")
        finally:
            # 清理临时文件
            if os.path.exists(temp_file):
                os.remove(temp_file)

    @staticmethod
    async def summarize_with_gpt(notes_content: str):
        """
        调用 GPT-4o 对笔记内容进行智能总结
        """
        try:
            response = openai.ChatCompletion.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "你是一个高效的学习助手。请根据用户提供的杂乱笔记，生成一份结构清晰、要点明确的最终总结。"},
                    {"role": "user", "content": notes_content}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"GPT 总结失败: {str(e)}")
