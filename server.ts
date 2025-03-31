#!/usr/bin/env ts-node
import { Server } from "./sdk/src/server/index.js";
import { StdioServerTransport } from "./sdk/src/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from "./sdk/src/types.js";
import axios from "axios";
import dotenv from "dotenv";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import fs from "fs";
import path from "path";
import os from "os";
import FormData from "form-data";
import { URLSearchParams } from "url";

dotenv.config({ path: path.resolve(__dirname, ".env") });

const MOBSF_URL = process.env.MOBSF_URL || "http://localhost:8000";
const MOBSF_API_KEY = process.env.MOBSF_API_KEY;
const TMP_LOG = path.join(os.tmpdir(), "mcp-mobsf.log");

function log(msg: string): void {
  const entry = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(TMP_LOG, entry);
  console.error(entry.trim());
}

const ScanFileArgsSchema = z.object({
  file: z.string().describe("Path to the APK or IPA file to scan with MobSF")
});

type ScanArgs = z.infer<typeof ScanFileArgsSchema>;

async function scanFile({ file }: ScanArgs) {
  const ext = path.extname(file).toLowerCase();
  const scanType = ext === ".apk" ? "apk" : ext === ".ipa" ? "ios" : null;

  if (!scanType) {
    return {
      isError: true,
      content: [{ type: "text", text: "Unsupported file type. Must be .apk or .ipa" }]
    };
  }

  try {
    log(`Uploading file: ${file}`);
    const form = new FormData();
    form.append("file", fs.createReadStream(file));

    const uploadRes = await axios.post(`${MOBSF_URL}/api/v1/upload`, form, {
      headers: {
        Authorization: MOBSF_API_KEY,
        ...form.getHeaders()
      }
    });

    const { hash, file_name } = uploadRes.data;
    log(`Uploaded successfully. Hash: ${hash}, File: ${file_name}`);

    const scanForm = new URLSearchParams();
    scanForm.append("hash", hash);
    scanForm.append("scan_type", scanType);
    scanForm.append("file_name", file_name);

    await axios.post(`${MOBSF_URL}/api/v1/scan`, scanForm.toString(), {
      headers: {
        Authorization: MOBSF_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    const reportForm = new URLSearchParams();
    reportForm.append("hash", hash);

    const reportRes = await axios.post(`${MOBSF_URL}/api/v1/report_json`, reportForm.toString(), {
      headers: {
        Authorization: MOBSF_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    const report = reportRes.data;

    const summary = scanType === "apk"
      ? {
          app_name: report.app_name,
          package_name: report.package_name,
          version_name: report.version_name,
          permissions: report.permissions,
          exported_activities: report.exported_activities,
          services: report.services,
          receivers: report.receivers,
          providers: report.providers,
          analysis_findings: {
            manifest_analysis: report.manifest_analysis,
            //code_analysis: report.code_analysis,
            urls: report.urls,
            domains: report.domains,
            tracker_analysis: report.tracker_analysis,
            network_security: report.network_security
          }
        }
      : {
          app_name: report.app_name,
          bundle_id: report.identifier,
          version: report.version,
          min_ios_version: report.minimum_os,
          platform: report.platform,
          binary_archs: report.archs,
          entitlements: report.entitlements,
          url_schemes: report.url_schemes,
          analysis_findings: {
            binary_code_analysis:report.binary_code_analysis,
            //urls:report.urls,
            possible_hardcoded_secrets:report.possible_hardcoded_secrets,
            binary_analysis: report.binary_analysis,
            strings_analysis: report.strings_analysis,
            keychain_analysis: report.keychain_analysis
          }
        };

    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }]
    };
  } catch (error: any) {
    const msg = error.response?.data ? JSON.stringify(error.response.data) : error.message || error.toString();
    log(`MobSF error: ${msg}`);
    return {
      isError: true,
      content: [{ type: "text", text: `MobSF scan failed: ${msg}` }]
    };
  }
}

const server = new Server(
  { name: "mobsf", version: "1.0.0" },
  { capabilities: { tools: { listChanged: true } } }
);

server.setRequestHandler(InitializeRequestSchema, async () => {
  log("Received initialize request");
  return {
    protocolVersion: "2024-11-05",
    capabilities: { tools: { listChanged: true } },
    serverInfo: { name: "mobsf", version: "1.0.0" },
    instructions: "This tool allows MobSF scanning (APK/IPA) via Claude using MCP."
  };
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "scanFile",
        description: "Upload and scan an APK or IPA using MobSF",
        inputSchema: zodToJsonSchema(ScanFileArgsSchema)
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  log(`Tool call received: ${name}`);

  if (name === "scanFile") {
    const parsed = ScanFileArgsSchema.safeParse(args);
    if (!parsed.success) {
      return {
        isError: true,
        content: [{ type: "text", text: "Invalid input to scanFile" }]
      };
    }
    return await scanFile(parsed.data);
  }

  return {
    isError: true,
    content: [{ type: "text", text: `Unknown tool: ${name}` }]
  };
});

async function run() {
  log("Starting MobSF MCP server...");
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    log("Server connected and ready.");
  } catch (err: any) {
    log(`Fatal startup error: ${err.message}`);
    process.exit(1);
  }
}

run();
