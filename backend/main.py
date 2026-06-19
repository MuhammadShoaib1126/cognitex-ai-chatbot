from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os
from collections import deque

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.7
)

protected_memory = []
normal_memory = deque(maxlen=20)
first_turn = True

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    protected_count: int
    window_count: int
    total_messages: int

@app.post("/clear")
def clear_history():
    global protected_memory, normal_memory, first_turn
    protected_memory = []
    normal_memory = deque(maxlen=20)
    first_turn = True
    return {"status": "cleared"}

@app.post("/chat")
def chat(request: ChatRequest):
    global first_turn
    
    user_msg = {"role": "user", "content": request.message}
    
    if first_turn:
        protected_memory.append(user_msg)
        full_context = protected_memory.copy()
        first_turn = False
    else:
        normal_memory.append(user_msg)
        full_context = protected_memory + list(normal_memory)
    
    messages_text = []
    for msg in full_context:
        prefix = "User" if msg['role'] == 'user' else "Assistant"
        messages_text.append(f"{prefix}: {msg['content']}")
    
    prompt = "\n".join(messages_text)
    prompt += "\nAssistant:"
    
    response = llm.invoke(prompt)
    ai_content = response.content.strip()
    
    ai_msg = {"role": "assistant", "content": ai_content}
    
    if len(normal_memory) == 0 and len(protected_memory) == 1:
        protected_memory.append(ai_msg)
    else:
        normal_memory.append(ai_msg)
    
    return ChatResponse(
        reply=ai_content,
        protected_count=len(protected_memory) // 2,
        window_count=len(normal_memory),
        total_messages=len(protected_memory) + len(normal_memory)
    )