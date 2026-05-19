const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname);
const dataFile = path.join(root, "election-data.json");
const port = Number(process.env.PORT || 8094);
const host = process.env.HOST || "0.0.0.0";

const fallbackImage =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="#e7edf3"/>
    <circle cx="200" cy="118" r="54" fill="#176f7a" opacity=".75"/>
    <path d="M94 267c22-65 68-98 106-98s84 33 106 98" fill="#d89a2b" opacity=".86"/>
  </svg>`);

function defaultData() {
  return {
    pollOpen: true,
    candidates: [
      {
        id: crypto.randomUUID(),
        name: "Sample Candidate",
        position: "Head Student",
        className: "10 A",
        image: fallbackImage,
        votes: 0
      }
    ]
  };
}

function readData() {
  if (!fs.existsSync(dataFile)) {
    const starter = defaultData();
    writeData(starter);
    return starter;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return {
      pollOpen: Boolean(parsed.pollOpen),
      candidates: Array.isArray(parsed.candidates) ? parsed.candidates : []
    };
  } catch {
    const starter = defaultData();
    writeData(starter);
    return starter;
  }
}

function writeData(data) {
  fs.writeFile(dataFile, JSON.stringify(data, null, 2), "utf8", (err) => {
    if (err) console.error("Background data save failed:", err);
  });
}

function localNetworkUrls() {
  const urls = [`http://localhost:${port}`];
  const interfaces = os.networkInterfaces();
  Object.values(interfaces).forEach((items) => {
    (items || []).forEach((item) => {
      if (item.family === "IPv4" && !item.internal) {
        urls.push(`http://${item.address}:${port}`);
      }
    });
  });
  return urls;
}

// FIX: Added CORS headers so browsers on other devices/origins can reach the API.
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
    "Connection": "close"
  };
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json",
    ...corsHeaders()
  });
  response.end(JSON.stringify(payload));
}

// FIX: Separated body reading from JSON parsing so a malformed or empty body
// returns a safe default instead of crashing the request handler.
// FIX: Body-too-large now properly rejects the promise instead of hanging forever.
function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 24_000_000) {
        // FIX: Reject before destroying so the promise settles immediately.
        reject(new Error("Request body is too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        // FIX: Malformed JSON returns a 400 via rejection rather than crashing.
        reject(new Error("Invalid JSON in request body"));
      }
    });
    request.on("error", reject);
  });
}

function contentType(filePath) {
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml"
  };
  return types[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.resolve(root, `.${decodeURIComponent(requestedPath)}`);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, contents) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentType(filePath),
      "Cache-Control": "no-store",
      "Connection": "close"
    });
    response.end(contents);
  });
}

async function handleApi(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  // FIX: Handle CORS preflight OPTIONS requests sent automatically by browsers
  // when making cross-origin requests (e.g. from a public tunnel URL).
  if (request.method === "OPTIONS") {
    response.writeHead(204, corsHeaders());
    response.end();
    return;
  }

  if (url.pathname === "/api/election" && request.method === "GET") {
    sendJson(response, 200, readData());
    return;
  }

  if (url.pathname === "/api/election" && request.method === "PUT") {
    const nextData = await readBody(request);
    const safeData = {
      pollOpen: Boolean(nextData.pollOpen),
      candidates: Array.isArray(nextData.candidates)
        ? nextData.candidates.map((candidate) => ({
            id: String(candidate.id || crypto.randomUUID()),
            name: String(candidate.name || "").trim(),
            position: String(candidate.position || "").trim(),
            className: String(candidate.className || "").trim(),
            image: String(candidate.image || fallbackImage),
            votes: Number(candidate.votes || 0)
          }))
        : []
    };
    writeData(safeData);
    sendJson(response, 200, safeData);
    return;
  }

if (url.pathname === "/api/vote-bulk" && request.method === "POST") {
    const body = await readBody(request);
    const data = readData();
    
    if (!data.pollOpen) {
      sendJson(response, 409, { message: "Poll is closed" });
      return;
    }

    // Make sure we have an array of IDs to work with
    const candidateIds = body.candidateIds || [];
    let votesUpdated = false;

    // Loop through the submitted selections and increment each one in memory
    candidateIds.forEach(id => {
      const candidate = data.candidates.find(item => item.id === id);
      if (candidate) {
        candidate.votes = Number(candidate.votes || 0) + 1;
        votesUpdated = true;
      }
    });

    // Save the updated counts in the background
    if (votesUpdated) {
      writeData(data);
    }

    // Instantly return success to the phone
    sendJson(response, 200, { success: true });
    return;
  }
  sendJson(response, 404, { message: "Not found" });
}

const server = http.createServer((request, response) => {
  if (request.url.startsWith("/api/") || request.method === "OPTIONS") {
    handleApi(request, response).catch((error) => {
      // FIX: Send 400 for bad request bodies, 500 for everything else.
      const status = error.message.includes("JSON") || error.message.includes("large") ? 400 : 500;
      sendJson(response, status, { message: error.message });
    });
    return;
  }
  serveStatic(request, response);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Close the old server window or set a different PORT.`);
    return;
  }
  console.error(error);
});

server.listen(port, host, () => {
  console.log("=================================================");
  console.log("  Falcon Election local server is running.");
  console.log("=================================================");
  console.log("");
  console.log("-- Same Wi-Fi access --");
  console.log("Open one of these links on any device on the same network:");
  localNetworkUrls().forEach((url) => console.log(`  Voting : ${url}`));
  localNetworkUrls().forEach((url) => console.log(`  Admin  : ${url}/admin.html`));
  console.log("");
  console.log("-- Remote access (different Wi-Fi / internet) --");
  console.log("To share with devices NOT on this Wi-Fi, run one of these");
  console.log("in a SECOND terminal window while the server is running:");
  console.log("");
  console.log("  Option A - npx localtunnel (no install needed):");
  console.log(`    npx localtunnel --port ${port}`);
  console.log("");
  console.log("  Option B - ngrok (free account at ngrok.com, then):");
  console.log(`    ngrok http ${port}`);
  console.log("");
  console.log("Either command will print a public https:// URL.");
  console.log("Share that URL and anyone on any network can open the poll.");
  console.log("=================================================");
});
