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
			api_key=api_key,
			model=model,
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

if not API_KEY:
	raise EnvironmentError("BLABLADOR_API_KEY is not set. Export it, e.g.:\nexport BLABLADOR_API_KEY=\"your_real_api_key_here\"\nthen run: python test.py")

def format_response(msg):
	return msg['choices'][0]['message']['content']

def get_response(completion, input):
	messages = [
		{"role": "system", "content": SYSTEM_PROMPT},
		{"role": "user",   "content": input},
	]
	response = completion.get_completion(messages)
	return format_response(json.loads(response))


# Check the available models
# models = Models(api_key=API_KEY).get_model_ids()
# print("Available models:", json.dumps(models, indent=4, sort_keys=True))

# print("Using Model:", models[1])

# Generate chat completions


completion = ChatCompletions(api_key=API_KEY, model=MODEL)

for i, que in enumerate(Questions):
	print(f"Question {i+1}: {que}")
	print(f"Answer {i+1}: {get_response(completion, que)}")
	print()

# # Generate completions
# completion = Completions(api_key=API_KEY, model=models[2])
# response = completion.get_completion("The best cuisine in the world is")
# print(json.dumps(json.loads(response), indent=4, sort_keys=True))
# print()