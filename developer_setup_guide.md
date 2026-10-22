# FACTORY EAR - DEVELOPER SETUP GUIDE ⚙️🔊

Welcome to the **Factory Ear** project repository! This guide will walk you through setting up the local development environment for both the FastAPI backend and the React frontend. 

## Prerequisites
Before you begin, ensure you have the following installed on your machine:
* **Python 3.11+** (For the ML pipeline and FastAPI backend)
* **Node.js 18+** (For the React/Vite frontend)
* **Git** (For version control)

---

## Phase 1: Clone the Repository
First, clone the project to your local machine and navigate into the root directory:
```bash
git clone https://github.com/your-username/factory-ear.git
cd factory-ear
```

---

## Phase 2: Backend Setup (Python & ML Pipeline)
Our backend handles the Librosa audio processing, ML inference, and API endpoints. We use a virtual environment to keep our dependencies clean.

**1. Navigate to the backend directory:**
```bash
cd backend
```

**2. Create and activate the virtual environment:**
* **Mac/Linux:**
  ```bash
  python3 -m venv .venv
  source .venv/bin/activate
  ```
* **Windows (Command Prompt / PowerShell):**
  ```bash
  python -m venv .venv
  .venv\Scripts\activate
  ```

**3. Install the dependencies:**
Make sure your pip is up to date, then install the required packages:
```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

**4. Run the local API server:**
*(Note: We will implement the actual API in `main.py` soon. This is the command you will use.)*
```bash
uvicorn app.main:app --reload --port 8000
```
The API will be available at `http://localhost:8000`.

---

## Phase 3: Frontend Setup (React UI)
The frontend is a React application built with TypeScript and Tailwind CSS. Open a **new terminal window** so you can run the frontend and backend at the same time.

**1. Navigate to the frontend directory:**
```bash
cd frontend
```

**2. Install Node dependencies:**
```bash
npm install
```

**3. Start the development server:**
```bash
npm start
# or 'npm run dev' if using Vite
```
The React dashboard will be available at `http://localhost:3000`.

---

## Phase 4: Data Management (Important!)
Because industrial audio datasets are massive (6GB+), **we do NOT commit raw `.wav` files to GitHub**. 

1. Download the **MIMII Pump** (`6_dB_pump.zip`) and the **Cutting Tool Wear** datasets independently.
2. Extract them locally into the `data/raw/` directory at the root of the project.
3. Our `.gitignore` is already configured to ignore anything inside `data/raw/`, so your commits will remain fast and lightweight.

If you encounter any issues with package versions or environment setups, ping the group chat!