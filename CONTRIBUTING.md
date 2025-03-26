# Contributing to GangaFlow 🚀

Thank you for considering contributing to **GangaFlow**! Whether you're helping squash bugs, improve documentation, or build new features — you're awesome.

---

## 🧱 Project Structure

```
ganga-flow/
│
├── frontend/           # React app for terminal + chat interface
├── ganga_backend/      # Django project core settings
├── assistant/          # Django app housing LLM agent & job logic
├── models/             # Fine-tuned LLM checkpoints & tokenizer
├── examples/           # Sample configs and jobs
└── docs/               # Documentation and architecture guides
```

---

## 🛠️ How to Contribute

### 1. Fork & Clone

```bash
git clone https://github.com/your-username/ganga-flow.git
cd ganga-flow
```

### 2. Setup Virtual Environment (Backend)

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Setup Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

---

## 💡 Types of Contributions

- 🐛 **Bug Fixes** — Report or fix issues in terminal, shell execution, or LLM outputs  
- 📖 **Docs** — Help make documentation easier to follow  
- ✨ **Features** — Add environment memory tools, command suggestion UI, job history, etc.  
- 🔬 **Model** — Improve LLM fine-tuning or command generation logic  
- 🎨 **UI/UX** — Help improve the visual layout or interactivity  

---

## 🔍 Issues & Discussions

- Browse the [Issues](https://github.com/your-repo/ganga-flow/issues) tab  
- Use [Discussions](https://github.com/your-repo/ganga-flow/discussions) for big ideas or proposals  

---

## ✅ Code Guidelines

- Use meaningful commit messages  
- Follow `black` formatting for Python code  
- Include docstrings for new Python methods  
- Prefer functional React components and hooks  
- Keep UI state management clean and modular  

---

## 📦 Pull Request Process

1. Fork the repo and create a new branch:  
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes  
3. Write or update tests if needed  
4. Push to your fork and submit a Pull Request  
5. Add a clear PR title and description explaining the changes  

---

## 📁 Suggested Branch Naming

| Type      | Prefix         | Example                      |
|-----------|----------------|------------------------------|
| Feature   | `feature/`     | `feature/chat-memory-sync`   |
| Bug Fix   | `fix/`         | `fix/terminal-output-delay`  |
| Refactor  | `refactor/`    | `refactor/frontend-layout`   |
| Docs      | `docs/`        | `docs/contributing-guide`    |

---

## 🙏 Thank You

Every contribution matters. Thank you for helping build a smarter, simpler way to interact with Ganga!

—
*Made with ❤️ by Sneha and the GangaFlow community*