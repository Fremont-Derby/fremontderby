    async advance(request, env, seasonId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      try {
        const actor = await authenticate(request, env, { fetch: fetchImpl });
        if (String(env?.ENVIRONMENT || '').trim() === 'dru') {
          const { finishedDruChampionship } = await import('./druChampionshipGuard.js');
          if (await finishedDruChampionship(env, seasonId, fetchImpl)) {
            return jsonResponse({ error: 'Championship is already finalized.' }, 409);
          }
        }
        const repository = createRepository(env, { fetch: fetchImpl });
        const championship = await advanceSeasonToChampionshipCommand(
          { seasonId, actorUserId: actor.id },
          repository,
        );
        return jsonResponse({ championship }, 201);
      } catch (error) {
        return jsonResponse({ error: safeClientErrorMessage(error) }, playoffStatusForError(error));
      }
    },
