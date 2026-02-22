
import os
import json
from blablador import ChatCompletions

API_KEY = os.getenv("BLABLADOR_API_KEY")
MODEL="1 - GPT-OSS-120b - an open model released by OpenAI in August 2025"
SYSTEM_PROMPT = (
	"You are GangaBot, an expert assistant for the Ganga job management framework used at CERN. "
	"Help users write, run, and debug Ganga jobs using simple English. "
	"When generating code, always use valid Ganga Python syntax."
	"Write in a concise style, and avoid unnecessary explanations."
)


Questions = [
    "Write a Ganga script that creates a job using the Executable application to run a simple shell script named hello.sh with the argument 'world'. Set it to run on the Local backend and submit it.",
    "How do I ensure a local data file named config.json is sent to the worker node, and how do I tell Ganga to bring back a resulting file named output.root?",
    "I have a job configured for a Local backend. Write the code to change that job's backend to Dirac (common in LHCb) and resubmit it as a new job.",
    "Explain how to use ArgSplitter to run the same executable 10 times, each time passing a different integer from 1 to 10 as an argument.",
    "If my subjobs produce multiple text files, how can I configure the job to automatically merge all stdout files into a single file once the master job completes?",
    "Write a Ganga script to run a DaVinci (LHCb) application. The version is 'v45r1', it uses an options file at ./run_ana.py, and it should run on the Dirac backend.",
    "How do you configure an Athena application in Ganga to use a specific ATLAS release and an option file?",
    "Write a Python loop that iterates through all jobs in the Ganga repository with the status 'failed' and resubmits only those jobs.",
    "In an LHCb context, how do I use BKQuery within Ganga to find a dataset path and assign it to j.inputdata?",
    "Where does Ganga store its configuration, and how would I programmatically change the gangadir (the location where job data is stored) within a script?"
]

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