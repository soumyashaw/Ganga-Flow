import os
import json
from dotenv import load_dotenv
from assistant.llm.client import ChatCompletions

load_dotenv()  # Load environment variables from .env file

API_KEY = os.getenv("BLABLADOR_API_KEY")
MODEL = os.getenv("GANGABOT_MODEL")
SYSTEM_PROMPT = os.getenv("GANGABOT_SYSTEM_PROMPT")

class GangaBot():
    """Stateful chat session with the LLM.
    One instance = one conversation (keeps full message history).
    """
	
    def __init__(self, api_key=None, model=None):
        self.client = ChatCompletions(
			api_key=api_key or API_KEY,
			model=model or MODEL,
        )
		
        self.history = [
			{"role": "system", "content": SYSTEM_PROMPT}
        ]
		
    def send(self, user_message: str) -> str:
        """Send a message, get a reply, and remember both."""
		# 1. Add user message to history
        self.history.append({"role": "user", "content": user_message})
		
        # 2. Call the API with full history (enables memory)
        raw = self.client.get_completion(self.history)
        data = json.loads(raw)
        reply = data["choices"][0]["message"]["content"]
		
        # 3. Add bot reply to history for context
        self.history.append({"role": "assistant", "content": reply})
        return reply
	
    def reset(self):
        """Clear history but keep system prompt (start a new conversation)."""
        self.history = [self.history[0]]