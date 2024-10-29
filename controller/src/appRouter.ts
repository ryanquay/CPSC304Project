import { Router, Request, Response } from 'express';
import { testOracleConnection, fetchBeatmapSet, fetchPlayer, fetchBeatmapSets, removeBeatmapSet, addBeatmapSetAuto, updateBeatmapSet, fetchTable, fetchPlayersAvgScoreGreaterThan, fetchKey, fetchPlayersAvgAccuracy, fetchMaxAvgAccPerMod, fetchWithFilters, fetchTableNames, fetchColumnNames, addMatch, fetchPlayersWithAllBeatmaps, addBeatmapSetManual, addSong } from './appService';
import { ResponseJSON, ErrorJSON, Player, BeatmapSetExtended, MatchPUTRequestBody, BeatmapSetPUTRequestBodyAuto, BeatmapSetPOSTRequestBody, BeatmapSetPUTRequestBodyManual, SongPUTRequestBody } from '@shared/types';
import chalk from 'chalk';

const appRouter = Router();

// GET root
appRouter.get('/', (req: Request, res: Response) => {
    console.debug(`appRouter.ts - received ${req.method}`);
    res.send('Hello, world with Express!');
});

// GET database connection status
// Derived from CPSC304 921 2024S2 Tutorial 2 Node.js Project Starter (https://github.students.cs.ubc.ca/CPSC304/CPSC304_Node_Project)
appRouter.get('/check-db-connection', async (req: Request, res: Response) => {
    console.debug(`appRouter.ts - received ${req.method}`);
    const isConnected = await testOracleConnection();
    res.send(`connected = ${isConnected}`);
});

// GET player
appRouter.get('/players/:playerid', async (req, res) => {
    console.debug(`appRouter.ts - received ${req.method}`);
    try {
        const row: Player[] = await fetchPlayer(req.params.playerid);
        const content: ResponseJSON = { success: true, data: row };
        res.json(content);
    } catch (error) {
        console.log('appRouter.ts - caught', chalk.red(error));
        const e = error as Error;
        const content: ErrorJSON = { success: false, name: e.name, message: e.message };
        res.json(content);
    }
});

// GET all beatmapsets (M5 rubric: JOIN)
appRouter.get('/beatmapsets', async (req, res) => {
    console.debug(`appRouter.ts - received ${req.method}`);
    try {
        const lb = Number(req.query['bpmAbove']);
        const ub = Number(req.query['bpmBelow']);
        const rows: BeatmapSetExtended[] = await fetchBeatmapSets(lb, ub);
        const content: ResponseJSON = { success: true, data: rows };
        res.json(content);
    } catch (error) {
        console.log('appRouter.ts - caught', chalk.red(error));
        const e = error as Error;
        const content: ErrorJSON = { success: false, name: e.name, message: e.message };
        res.json(content);
    }
});

// GET beatmapset
appRouter.get('/beatmapsets/:beatmapSetId', async (req, res) => {
    console.debug(`appRouter.ts - received ${req.method}`);
    try {
        const row: BeatmapSetExtended[] = await fetchBeatmapSet(req.params.beatmapSetId);
        const content: ResponseJSON = { success: true, data: row };
        res.json(content);
    } catch (error) {
        console.log('appRouter.ts - caught', chalk.red(error));
        const e = error as Error;
        const content: ErrorJSON = { success: false, name: e.name, message: e.message };
        res.json(content);
    }
});

// DELETE beatmapset
appRouter.delete('/beatmapsets/:beatmapSetId', async (req, res) => {
    console.debug(`appRouter.ts - received ${req.method}`);
    try {
        const affected: number = await removeBeatmapSet(req.params.beatmapSetId);
        const content: ResponseJSON = { success: true, rowsAffected: affected };
        res.json(content);
    } catch (error) {
        console.log('appRouter.ts - caught', chalk.red(error));
        const e = error as Error;
        const content: ErrorJSON = { success: false, name: e.name, message: e.message };
        res.json(content);
    }
});

// PUT beatmapset (M5 rubric: INSERT)
appRouter.put('/beatmapsets', async (req, res) => {
    console.debug(`appRouter.ts - received ${req.method}`);
    try {
        let affected;
        if (req.query['auto'] === 'false') {
            const body: BeatmapSetPUTRequestBodyManual = req.body;
            affected = await addBeatmapSetManual(body);
        } else {
            const body: BeatmapSetPUTRequestBodyAuto = req.body;
            affected = await addBeatmapSetAuto(body.beatmapSetId);
        }
        const content: ResponseJSON = { success: true, rowsAffected: affected };
        res.json(content);
    } catch (error) {
        console.log('appRouter.ts - caught', chalk.red(error));
        const e = error as Error;
        const content: ErrorJSON = { success: false, name: e.name, message: e.message };
        res.json(content);
    }
});

// POST beatmapset (M5 rubric: UPDATE)
appRouter.post('/beatmapsets/:beatmapSetId', async (req, res) => {
    console.debug(`appRouter.ts - received ${req.method}`);
    try {
        const body: BeatmapSetPOSTRequestBody = req.body;
        const affected = await updateBeatmapSet(req.params.beatmapSetId, body);
        const content: ResponseJSON = { success: true, rowsAffected: affected };
        res.json(content);
    } catch (error) {
        console.log('appRouter.ts - caught', chalk.red(error));
        const e = error as Error;
        const content: ErrorJSON = { success: false, name: e.name, message: e.message };
        res.json(content);
    }
});

// GET names of all tables
appRouter.get('/tables', async (req: Request, res: Response) => {
    console.debug(`appRouter.ts - received ${req.method}`);
    try {
        const rows = await fetchTableNames();
        const content: ResponseJSON = { success: true, data: rows };
        res.json(content);
    } catch (error) {
        console.log('appRouter.ts - caught', chalk.red(error));
        const e = error as Error;
        const content: ErrorJSON = { success: false, name: e.name, message: e.message };
        res.json(content);
    }
});

// GET table (M5 rubric: Projection)
appRouter.get('/tables/:tableName', async (req, res) => {
    console.debug(`appRouter.ts - received ${req.method}`);
    try {
        const tableName = req.params.tableName;
        const attributes = req.query['attributes'] as string | undefined;
        const rows = await fetchTable(tableName, attributes);
        const content: ResponseJSON = { success: true, data: rows };
        res.json(content);
    } catch (error) {
        console.log('appRouter.ts - caught', chalk.red(error));
        const e = error as Error;
        const content: ErrorJSON = { success: false, name: e.name, message: e.message };
        res.json(content);
    }
});

// GET primary key of table
appRouter.get('/keys/:tableName', async (req, res) => {
    console.debug(`appRouter.ts - received ${req.method}`);
    try {
        const tableName = req.params.tableName;
        const rows = await fetchKey(tableName);
        const content: ResponseJSON = { success: true, data: rows };
        res.json(content);
    } catch (error) {
        console.log('appRouter.ts - caught', chalk.red(error));
        const e = error as Error;
        const content: ErrorJSON = { success: false, name: e.name, message: e.message };
        res.json(content);
    }
});

// GET attributes of table
appRouter.get('/attributes/:tableName', async (req: Request, res: Response) => {
    console.debug(`appRouter.ts - received ${req.method}`);
    try {
        const tableName = req.params['tableName'] as string;
        const columnNames = await fetchColumnNames(tableName);
        const content = { success: true, data: columnNames };
        res.json(content);
    } catch (error) {
        console.log('appRouter.ts - caught', chalk.red(error));
        const e = error as Error;
        const content = { success: false, name: e.name, message: e.message };
        res.json(content);
    }
});

// GET players with average score greater than given score (M5 rubric: Aggregation with HAVING)
appRouter.get('/players-with-avg-score-greater-than/:lowerBound', async (req, res) => {
    console.debug(`appRouter.ts - received ${req.method}`);
    try {
        const lowerBound = req.params.lowerBound;
        const rows = await fetchPlayersAvgScoreGreaterThan(lowerBound);
        const content: ResponseJSON = { success: true, data: rows };
        res.json(content);
    } catch (error) {
        console.log('appRouter.ts - caught', chalk.red(error));
        const e = error as Error;
        const content: ErrorJSON = { success: false, name: e.name, message: e.message };
        res.json(content);
    }
});

// GET selected rows with conditions (M5 rubric: Selection)
appRouter.get('/select/:tableName', async (req, res) => {
    console.debug(`appRouter.ts - received ${req.method}`);
    try {
        const tableName = req.params.tableName;
        const filters = req.query['filters'] as string;
        const rows = await fetchWithFilters(tableName, filters);
        const content: ResponseJSON = { success: true, data: rows };
        res.json(content);
    } catch (error) {
        console.log('appRouter.ts - caught', chalk.red(error));
        const e = error as Error;
        const content: ErrorJSON = { success: false, name: e.name, message: e.message };
        res.json(content);
    }
});

// GET average accuracy of players (M5 rubric: Aggregation with GROUP BY)
appRouter.get('/players-with-avg-accuracy', async (req, res) => {
    console.debug(`appRouter.ts - received ${req.method}`);
    try {
        const playerId = req.query['playerId'] as string | undefined;
        const rows = await fetchPlayersAvgAccuracy(playerId);
        const content: ResponseJSON = { success: true, data: rows };
        res.json(content);
    } catch (error) {
        console.log('appRouter.ts - caught', chalk.red(error));
        const e = error as Error;
        const content: ErrorJSON = { success: false, name: e.name, message: e.message };
        res.json(content);
    }
});

// GET maximum average accuracy from each mod-combo (M5 rubric: Nested Aggregation with GROUP BY)
appRouter.get('/max-avg-accuracy-per-mod', async (req, res) => {
    console.debug(`appRouter.ts - received ${req.method}`);
    try {
        const rows = await fetchMaxAvgAccPerMod();
        const content: ResponseJSON = { success: true, data: rows };
        res.json(content);
    } catch (error) {
        console.log('appRouter.ts - caught', chalk.red(error));
        const e = error as Error;
        const content: ErrorJSON = { success: false, name: e.name, message: e.message };
        res.json(content);
    }
});

// PUT match
appRouter.put('/matches', async (req, res) => {
    console.debug(`appRouter.ts - received ${req.method}`);
    try {
        const body: MatchPUTRequestBody = req.body;
        const affected = await addMatch(body);
        const content: ResponseJSON = { success: true, rowsAffected: affected };
        res.json(content);
    } catch (error) {
        console.log('appRouter.ts - caught', chalk.red(error));
        const e = error as Error;
        const content: ErrorJSON = { success: false, name: e.name, message: e.message };
        res.json(content);
    }
});

// GET players who have scores on all beatmaps (M5 rubric: Division)
appRouter.get('/players-with-all-beatmaps', async (req, res) => {
    console.debug(`appRouter.ts - received ${req.method}`);
    try {
        const rows = await fetchPlayersWithAllBeatmaps();
        const content: ResponseJSON = { success: true, data: rows };
        res.json(content);
    } catch (error) {
        console.log('appRouter.ts - caught', chalk.red(error));
        const e = error as Error;
        const content: ErrorJSON = { success: false, name: e.name, message: e.message };
        res.json(content);
    }
});

// PUT song
appRouter.put('/songs', async (req, res) => {
    console.debug(`appRouter.ts - received ${req.method}`);
    try {
        const body: SongPUTRequestBody = req.body;
        const affected = await addSong(body);
        const content: ResponseJSON = { success: true, rowsAffected: affected };
        res.json(content);
    } catch (error) {
        console.log('appRouter.ts - caught', chalk.red(error));
        const e = error as Error;
        const content: ErrorJSON = { success: false, name: e.name, message: e.message };
        res.json(content);
    }
});

export default appRouter;
