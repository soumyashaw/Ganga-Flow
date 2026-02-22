import requests
import json


class Models():
   
    def __init__(self, api_key):
        self.api_key = api_key
        self.headers = {'accept': 'application/json', 'Authorization': f'Bearer {api_key}'}
   
    url = "https://api.helmholtz-blablador.fz-juelich.de/v1/models"
     
    def get_model_data(self):
        resp = requests.get(url=self.url, headers=self.headers)
        if not resp.ok:
            raise RuntimeError(f"GET {self.url} failed: {resp.status_code} - {resp.text}")
        try:
            data = resp.json()
        except ValueError:
            raise RuntimeError(f"Invalid JSON response from {self.url}: status={resp.status_code}, body={resp.text[:500]}")
        return data.get("data", data)

    def get_model_ids(self):
        resp = requests.get(url=self.url, headers=self.headers)
        if not resp.ok:
            raise RuntimeError(f"GET {self.url} failed: {resp.status_code} - {resp.text}")
        try:
            data = resp.json()
        except ValueError:
            raise RuntimeError(f"Invalid JSON response from {self.url}: status={resp.status_code}, body={resp.text[:500]}")

        ids = []
        for model in data.get("data", []):
            ids.append(model.get("id"))

        return ids

class ChatCompletions():

    def __init__(self, api_key, model, temperature = 0.7, choices =  1, max_tokens = 1024, user = 'default'):
        self.api_key = api_key
        self.model = model
        self.temperature = temperature
        self.choices = choices
        self.max_tokens = max_tokens
        self.user = user
        self.headers = {'accept': 'application/json', 'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'}

   
    url = "https://api.helmholtz-blablador.fz-juelich.de/v1/chat/completions"
    
    top_p =  1
    presence_penalty = 0
    frequency_penalty = 0

    def get_completion(self, messages):
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
            "top_p": self.top_p,
            "n": self.choices,
            "max_tokens": self.max_tokens,
            "stop": None,
            "stream": False,
            "presence_penalty": self.presence_penalty,
            "frequency_penalty": self.frequency_penalty,
            "user": self.user
        }
        payload = json.dumps(payload)
        
        response = requests.post(url = self.url, headers = self.headers, data=payload)
        
        # Error handling for different status codes
        if response.status_code == 200:
            return response.text
        elif response.status_code == 400:
            raise ValueError(f"Bad Request (400): Invalid parameters or malformed request. Response: {response.text}")
        elif response.status_code == 401:
            raise PermissionError(f"Unauthorized (401): Invalid or missing API key. Response: {response.text}")
        elif response.status_code == 403:
            raise PermissionError(f"Forbidden (403): Access denied. Response: {response.text}")
        elif response.status_code == 404:
            raise ValueError(f"Not Found (404): Endpoint or model not found. Response: {response.text}")
        elif response.status_code == 429:
            raise RuntimeError(f"Too Many Requests (429): Rate limit exceeded. Response: {response.text}")
        elif response.status_code >= 500:
            raise RuntimeError(f"Server Error ({response.status_code}): The API server encountered an error. Response: {response.text}")
        else:
            raise RuntimeError(f"Unexpected Error ({response.status_code}): {response.text}")

class Completions():

    def __init__(self, api_key, model,temperature = 0.7, choices = 1, max_tokens =  50, user = "default"):
        self.api_key = api_key
        self.model = model
        self.temperature = temperature
        self.choices = choices
        self.max_tokens = max_tokens
        self.user = user

        self.headers = {'accept': 'application/json', 'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'}

   
    url = "https://api.helmholtz-blablador.fz-juelich.de/v1/completions"
    
    suffix = None
    logprobs = 0
    echo = False
    top_p =  1
    presence_penalty = 0
    frequency_penalty = 0

    def get_completion(self, prompt):
        payload = {
            "model": self.model,
            "prompt": prompt,
            "temperature": self.temperature,
            "n": self.choices,
            "max_tokens": self.max_tokens,
            "stop": None,
            "stream": False,
            "top_p": self.top_p,
            "logprobs":self.logprobs,
            "echo":self.echo,
            "presence_penalty": self.presence_penalty,
            "frequency_penalty": self.frequency_penalty,
            "user": self.user
        }

        payload = json.dumps(payload)
        
        response = requests.post(url = self.url, headers = self.headers, data=payload)
        
        # Error handling for different status codes
        if response.status_code == 200:
            return response.text
        elif response.status_code == 400:
            raise ValueError(f"Bad Request (400): Invalid parameters or malformed request. Response: {response.text}")
        elif response.status_code == 401:
            raise PermissionError(f"Unauthorized (401): Invalid or missing API key. Response: {response.text}")
        elif response.status_code == 403:
            raise PermissionError(f"Forbidden (403): Access denied. Response: {response.text}")
        elif response.status_code == 404:
            raise ValueError(f"Not Found (404): Endpoint or model not found. Response: {response.text}")
        elif response.status_code == 429:
            raise RuntimeError(f"Too Many Requests (429): Rate limit exceeded. Response: {response.text}")
        elif response.status_code >= 500:
            raise RuntimeError(f"Server Error ({response.status_code}): The API server encountered an error. Response: {response.text}")
        else:
            raise RuntimeError(f"Unexpected Error ({response.status_code}): {response.text}")