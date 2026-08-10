import {
  getOwnPlayerProfileCommand,
  saveOwnPlayerProfileCommand,
} from './playerProfileCommands.js';
import { createPlayerProfileRepository } from './playerProfileRepository.js';
import { publishSeasonScheduleCommand } from './seasonCommands.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import { createSupabaseSeasonRepository } from './supabaseSeasonRepository.js';
import { createTeamWithCaptainCommand } from './teamCommands.js';
import { createTeamRepository } from './teamRepository.js';

const serviceName = "fremontderby";

function versionMetadata(env = {}) {
  const metadata = env.CF_VERSION_METADATA || {};
  return {
    id: metadata.id || "local",
    tag: metadata.tag || null,
    timestamp: metadata.timestamp || null,
  };
}

export function renderLandingPage(env = {}) {
  const version = versionMetadata(env);
  const versionLabel = version.id === "local" ? "local development" : version.id;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Fremont Derby</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #07150f; color: #f4f7f5; }
    main { width: min(680px, calc(100% - 32px)); border: 1px solid #315d45; border-radius: 18px; background: #0b2418; padding: 36px; box-shadow: inset 0 0 0 6px #132d20; }
    .balls { display: flex; gap: 10px; margin-bottom: 24px; }
    .ball { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; color: #111; background: #fff; border: 3px solid #d9dedb; }
    .ball.nine { background: linear-gradient(#f4d64b 0 34%, #fff 34% 66%, #f4d64b 66%); }
    h1 { margin: 0; font-size: clamp(2.2rem, 8vw, 4.5rem); line-height: .95; letter-spacing: -.04em; }
    p { color: #b8c8be; line-height: 1.6; }
    code { color: #d4f6df; overflow-wrap: anywhere; }
    .status { margin-top: 28px; border-top: 1px solid #315d45; padding-top: 18px; font-size: .9rem; }
  </style>
</head>
<body>
  <main>
    <div class="balls" aria-hidden="true"><span class="ball">8</span><span class="ball nine">9</span></div>
    <h1>Fremont Derby</h1>
    <p>The deployment path is working. League development starts here.</p>
    <div class="status">Worker version: <code>${versionLabel}</code></div>
  </main>
</body>
</html>`;
}

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

async function readJsonBody(request) {
  try {
    const body = await request.json();
    if (!body || Array.isArray(body) || typeof body !== "object") {
      throw new Error("Request body must be a JSON object");
    }
    return body;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Request body must be valid JSON");
    }
    throw error;
  }
}

function statusForError(error) {
  if (error instanceof AuthError) return error.status;
  if (error.message === "Season not found") return 404;
  if (error.message === "Actor is not a league admin") return 403;
  if (error.message.includes("Actor is not a league admin")) return 403;
  if (error.message.startsWith("Supabase request failed with 401")) return 401;
  if (error.message.startsWith("Supabase request failed with 403")) return 403;
  return 400;
}

export async function handlePublishScheduleRequest(
  request,
  env,
  seasonId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    if (!body.firstRoundDate) {
      throw new Error("firstRoundDate is required");
    }

    const repository = createSupabaseSeasonRepository(env, { fetch: fetchImpl });
    const result = await publishSeasonScheduleCommand(
      {
        seasonId,
        actorUserId: actor.id,
        firstRoundDate: body.firstRoundDate,
        intervalDays: body.intervalDays,
        tableNumbers: body.tableNumbers,
      },
      repository,
    );

    return jsonResponse(result, 201);
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleGetOwnProfileRequest(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createPlayerProfileRepository(env, { fetch: fetchImpl });
    const profile = await getOwnPlayerProfileCommand(
      { actorUserId: actor.id },
      repository,
    );

    return jsonResponse({ profile });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleSaveOwnProfileRequest(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createPlayerProfileRepository(env, { fetch: fetchImpl });
    const profile = await saveOwnPlayerProfileCommand(
      {
        actorUserId: actor.id,
        displayName: body.displayName,
      },
      repository,
    );

    return jsonResponse({ profile });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleCreateTeamRequest(
  request,
  env,
  seasonId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createTeamRepository(env, { fetch: fetchImpl });
    const team = await createTeamWithCaptainCommand(
      {
        actorUserId: actor.id,
        seasonId,
        teamName: body.teamName ?? body.name,
      },
      repository,
    );

    return jsonResponse({ team }, 201);
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const version = versionMetadata(env);
    const publishScheduleMatch = url.pathname.match(
      /^\/api\/admin\/seasons\/([^/]+)\/publish-schedule$/,
    );
    const createTeamMatch = url.pathname.match(
      /^\/api\/seasons\/([^/]+)\/teams$/,
    );

    if (url.pathname === "/health") {
      return Response.json(
        {
          ok: true,
          service: serviceName,
          version: version.id,
          versionTag: version.tag,
          deployedAt: version.timestamp,
        },
        { headers: { "cache-control": "no-store" } },
      );
    }

    if (publishScheduleMatch) {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handlePublishScheduleRequest(
        request,
        env,
        decodeURIComponent(publishScheduleMatch[1]),
      );
    }

    if (url.pathname === "/api/me/profile") {
      if (request.method === "GET") {
        return handleGetOwnProfileRequest(request, env);
      }
      if (request.method === "PUT") {
        return handleSaveOwnProfileRequest(request, env);
      }

      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    if (createTeamMatch) {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleCreateTeamRequest(
        request,
        env,
        decodeURIComponent(createTeamMatch[1]),
      );
    }

    if (url.pathname.startsWith("/api/")) {
      return jsonResponse({ error: "Not found" }, 404);
    }

    return new Response(renderLandingPage(env), {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  },
};
