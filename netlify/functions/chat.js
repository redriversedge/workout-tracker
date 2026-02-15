var https = require(“https”);

exports.handler = async function (event) {
var headers = {
“Content-Type”: “application/json”,
“Access-Control-Allow-Origin”: “*”,
“Access-Control-Allow-Headers”: “Content-Type”,
“Access-Control-Allow-Methods”: “POST, OPTIONS”
};

if (event.httpMethod === “OPTIONS”) {
return { statusCode: 204, headers: headers, body: “” };
}

if (event.httpMethod !== “POST”) {
return {
statusCode: 405,
headers: headers,
body: JSON.stringify({ error: { message: “Use POST” } })
};
}

var apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
return {
statusCode: 500,
headers: headers,
body: JSON.stringify({
error: {
message: “ANTHROPIC_API_KEY not set in Netlify environment variables.”
}
})
};
}

try {
var body = JSON.parse(event.body);
var payload = JSON.stringify({
model: body.model || “claude-sonnet-4-20250514”,
max_tokens: body.max_tokens || 500,
system: body.system || “You are Red, the AI fitness coach for RedRiversEdgeFitness.”,
messages: body.messages || []
});

```
var data = await new Promise(function (resolve, reject) {
  var options = {
    hostname: "api.anthropic.com",
    port: 443,
    path: "/v1/messages",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Length": Buffer.byteLength(payload)
    }
  };

  var req = https.request(options, function (res) {
    var chunks = [];
    res.on("data", function (chunk) {
      chunks.push(chunk);
    });
    res.on("end", function () {
      try {
        var raw = Buffer.concat(chunks).toString();
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(new Error("Failed to parse response"));
      }
    });
  });

  req.on("error", function (e) {
    reject(new Error("Request failed: " + e.message));
  });

  req.setTimeout(30000, function () {
    req.destroy();
    reject(new Error("Request timed out"));
  });

  req.write(payload);
  req.end();
});

return {
  statusCode: 200,
  headers: headers,
  body: JSON.stringify(data)
};
```

} catch (err) {
return {
statusCode: 500,
headers: headers,
body: JSON.stringify({
error: { message: “Function error: “ + err.message }
})
};
}
};
