from flask import Flask, render_template, request, jsonify
import json
import requests
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

app = Flask(__name__)

# 从环境变量读取API信息（更安全）
APPID = os.getenv("APPID")
APISecret = os.getenv("API_SECRET")
APIKey = os.getenv("API_KEY")
api_key = os.getenv("SPARK_API_KEY")
url = os.getenv("SPARK_URL", "https://spark-api-open.xf-yun.com/v1/chat/completions")

# Einstein persona system prompt
einstein_persona = {
    "role": "system",
    "content": "你是一位名为爱因斯坦的智慧物理学家，专门为小学生解答物理问题。你的回答总是充满鼓励和趣味性，能够用简单易懂的语言解释复杂的物理概念。你会用生动的比喻和有趣的例子，激发孩子们对物理的好奇心和学习兴趣。当孩子们感到困惑时，你会耐心地引导他们，而不是直接给出答案。你的口头禅是“想象力比知识更重要！”"
}

# Function to get the answer from the model
def get_answer(message):
    headers = {
        'Authorization': api_key,
        'content-type': "application/json"
    }
    
    # Add the Einstein persona to the message history
    messages = [einstein_persona] + message
    
    body = {
        "model": "4.0Ultra",
        "user": "user_id",
        "messages": messages,
        "stream": False,  # Set to False for simpler handling
        "tools": [
            {
                "type": "web_search",
                "web_search": {
                    "enable": True,
                    "search_mode": "deep"
                }
            }
        ]
    }
    
    try:
        response = requests.post(url=url, json=body, headers=headers)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        # Debugging: Print the raw response from the API
        print("API Response:", response.text)
        
        # Check if the response is valid JSON
        if 'application/json' in response.headers.get('Content-Type', ''):
            data = response.json()
            if 'choices' in data and data['choices']:
                content = data['choices'][0].get('message', {}).get('content', '')
                return content.strip() if content else "抱歉，我暂时无法回答这个问题。"
            else:
                return "API响应格式不正确，缺少'choices'字段。"
        else:
            return "API未返回有效的JSON响应。"
            
    except requests.exceptions.RequestException as e:
        print(f"请求错误: {e}")
        return "请求API时发生网络错误。"
    except json.JSONDecodeError:
        return "无法解析API响应。"
    except Exception as e:
        print(f"处理响应时发生未知错误: {e}")
        return "处理响应时发生未知错误。"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get('message')
    
    # For simplicity, we'll just use the user input directly
    # In a real application, you would manage conversation history
    chat_history = [{"role": "user", "content": user_input}]
    
    response = get_answer(chat_history)
    
    return jsonify({'response': response})

if __name__ == '__main__':
    app.run(debug=True)