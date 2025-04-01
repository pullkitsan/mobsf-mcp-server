# 🛡MobSF MCP Tool

This is an MCP (Model Context Protocol) compatible tool that allows MobSF (Mobile Security Framework) to scan APK and IPA files directly via Claude, 5ire, or any MCP-capable client.



# Prerequisites

* MobSF should be installed on the system. 
* Download the [MCP typescript sdk](https://github.com/modelcontextprotocol/typescript-sdk) and rename the folder to sdk.

# 🚀 Features

- Supports APK and IPA file scanning

- Uses MobSF's REST API to:

<pre>Upload files

Trigger scans

Fetch analysis summary

Automatically filters large results like strings or secrets (to prevent output overload)

MCP-compatible interface via server.ts</pre>


# 🎞️ Installation

Clone the repo and install dependencies:

<pre>git clone https://github.com/yourusername/mobsf-mcp.git
cd mobsf-mcp
npm install </pre>


# 🔐 Setup

Copy the .env.example to .env:

> cp .env.example .env

Edit .env to include your MobSF API key:

<pre>MOBSF_API_KEY=YOUR_MOBSF_API_KEY

MOBSF_URL=http://localhost:8000 </pre>


# ▶️ Run the Server

* Add the configuration settings shown at the end for claude AI desktop app, it will automatically run the server.

* Make sure your MobSF server is running locally at http://localhost:8000.

# 🧲 Example Input

* The server exposes tool **scanFile** . So,  use any MCP client to try the following prompt **scan <FILE>.apk** or **scan <FILE>.ipa**. It will scan the IPA or APK file and will analyze the report(json) for you.  


# 📌 Notes

- Only .apk and .ipa file types are supported.

- This tool avoids fetching large fields like raw strings or source code dumps to keep responses fast and compliant with Claude/5ire message limits.


# ✅ Claude Config file (Example)

<pre> {
  "mcpServers": {
    "mobsf": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/server.ts"]
    }
  }
} </pre>

