🛡️ MobSF MCP Tool

This is an MCP (Model Context Protocol) compatible tool that allows MobSF (Mobile Security Framework) to scan APK and IPA files directly via Claude, 5ire, or any MCP-capable client.


🚀 Features

Supports APK and IPA file scanning

Uses MobSF's REST API to:

Upload files

Trigger scans

Fetch analysis summary

Automatically filters large results like strings or secrets (to prevent output overload)

MCP-compatible interface via server.ts


🎞️ Installation

Clone the repo and install dependencies:

git clone https://github.com/yourusername/mobsf-mcp.git
cd mobsf-mcp
npm install


🔐 Setup

Copy the .env.example to .env:

cp .env.example .env

Edit .env to include your MobSF API key:

MOBSF_API_KEY=your_mobsf_api_key_here
MOBSF_URL=http://localhost:8000


▶️ Run the Server

This tool is built using TypeScript and runs via tsx. You can run it with:

npx tsx server.ts


Make sure your MobSF server is running locally at http://localhost:8000.

🧲 Example Input

You can call the tool via an MCP client using:

{
  "file": "/absolute/path/to/app.apk"
}

Or:

{
  "file": "/absolute/path/to/app.ipa"
}


📁 Project Structure

mobsf-mcp/
├── server.ts              # Main MCP server logic
├── sdk/                   # MCP SDK
├── package.json
├── tsconfig.json
├── .env.example           # Template for env setup
└── .gitignore


📌 Notes

Only .apk and .ipa file types are supported.

This tool avoids fetching large fields like raw strings or source code dumps to keep responses fast and compliant with Claude/5ire message limits.


✅ Claude Config file (Example)

{
  "mcpServers": {
    "mobsf": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/server.ts"]
    }
  }
}

📄 License

MIT © 2025
