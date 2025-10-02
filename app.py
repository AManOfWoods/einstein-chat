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
        'Authorization': f'Bearer {api_key}',  # 讯飞星火API使用Bearer token格式
        'Content-Type': "application/json"
    }
    
    # Add the Einstein persona to the message history
    messages = [einstein_persona] + message
    
    body = {
        "model": "x1",
        "user": "user_id",
        "messages": messages,
        "stream": False,  # Set to False for simpler handling
        "max_tokens": 4096,
        "temperature": 1.2
    }
    
    try:
        print(f"[DEBUG] 准备调用API，URL: {url}", flush=True)
        print(f"[DEBUG] API Key: {api_key[:20] if api_key else 'None'}...", flush=True)
        print(f"[DEBUG] Headers: {headers}", flush=True)

        response = requests.post(url=url, json=body, headers=headers, timeout=30)

        print(f"[DEBUG] API响应状态码: {response.status_code}", flush=True)
        print(f"[DEBUG] API响应内容: {response.text[:1000]}", flush=True)

        # 先检查状态码，不要立即raise_for_status
        if response.status_code != 200:
            error_msg = f"API返回错误状态码 {response.status_code}: {response.text[:500]}"
            print(f"[ERROR] {error_msg}", flush=True)
            return error_msg

        response.raise_for_status()

        # Check if the response is valid JSON
        if 'application/json' in response.headers.get('Content-Type', ''):
            data = response.json()
            if 'choices' in data and data['choices']:
                content = data['choices'][0].get('message', {}).get('content', '')
                return content.strip() if content else "抱歉，我暂时无法回答这个问题。"
            else:
                print(f"[ERROR] API响应缺少choices字段: {data}")
                return f"API响应格式不正确。响应内容: {str(data)[:200]}"
        else:
            print(f"[ERROR] 非JSON响应: {response.text[:200]}")
            return "API未返回有效的JSON响应。"

    except requests.exceptions.Timeout as e:
        print(f"[ERROR] 请求超时: {e}")
        return "API请求超时，请稍后重试。"
    except requests.exceptions.ConnectionError as e:
        print(f"[ERROR] 连接错误: {e}")
        return "无法连接到API服务器，请检查网络。"
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] 请求异常: {type(e).__name__} - {e}")
        return f"请求API时发生错误: {type(e).__name__}"
    except json.JSONDecodeError as e:
        print(f"[ERROR] JSON解析错误: {e}")
        return "无法解析API响应。"
    except Exception as e:
        print(f"[ERROR] 未知错误: {type(e).__name__} - {e}")
        import traceback
        traceback.print_exc()
        return f"处理响应时发生错误: {type(e).__name__}"

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
    port = int(os.getenv('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)