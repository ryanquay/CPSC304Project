import oracledb, { DBError } from 'oracledb';
import Config from './util/config';
import { parseSQL } from './util/util';
import chalk from 'chalk';
import { BeatmapSetExtended, BeatmapSetPOSTRequestBody, BeatmapSetPUTRequestBodyManual, MatchPUTRequestBody, Player, PlayerAvgAccuracy, PlayerAvgScore, SongPUTRequestBody } from '@shared/types';
import { osu } from './server';

// init connection pool
// Derived from CPSC304 921 2024S2 Tutorial 2 Node.js Project Starter ()
export async function initializeConnectionPool (): Promise<void> {
    try {
        await oracledb.createPool(Config.DB_CONFIG);
        console.log('initializeConnectionPool - Connection pool started!');
    } catch (error) {
        console.error(`initializeConnectionPool - Initialization error: ${(error as Error).message}`);
    }
}

// close connection pool
// Derived from CPSC304 921 2024S2 Tutorial 2 Node.js Project Starter (https://github.students.cs.ubc.ca/CPSC304/CPSC304_Node_Project)
export async function closePoolAndExit (): Promise<void> {
    console.log('closePoolAndExit - Terminating...');
    try {
        // wait 10s before closing, for connections to finish
        await oracledb.getPool().close(10);
        console.log('closePoolAndExit - Pool closed!');
        process.exit(0);
    } catch (error) {
        console.error((error as Error).message);
        process.exit(1);
    }
}

// wrapper to manage OracleDB actions; simplifies connection handling
// Derived from CPSC304 921 2024S2 Tutorial 2 Node.js Project Starter (https://github.students.cs.ubc.ca/CPSC304/CPSC304_Node_Project)
type OracleDBAction = (connection: oracledb.Connection) => Promise<any>;
async function withOracleDB (action: OracleDBAction): Promise<any> {
    let connection;
    try {
        // get connection from default pool
        connection = await oracledb.getConnection();
        return await action(connection);
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (error) {
                console.error(error);
            }
        }
    }
}

// return connection status of database
// Derived from CPSC304 921 2024S2 Tutorial 2 Node.js Project Starter (https://github.students.cs.ubc.ca/CPSC304/CPSC304_Node_Project)
export async function testOracleConnection (): Promise<boolean> {
    return await withOracleDB(async (_connection) => true).catch(() => false);
}

// run the re-initialization script
// FIXME: if time permits, use executeMany for batch optimization
export async function recreateTables(): Promise<void> {
    return await withOracleDB(async (connection) => {
        // parse and run sql (exec only does one at a time)
        const statements = parseSQL('./sql/recreate_tables.sql');
        for (const sql of statements) {
            try {
                console.log('recreateTables - executing', chalk.cyan(sql));
                await connection.execute(sql, [], { autoCommit: true });
            } catch (error) {
                if (error && typeof error === 'object' && 'errorNum' in error && ((error.errorNum === 955) || (error.errorNum === 1))) {
                    console.log('recreateTables - caught', chalk.yellow((error as DBError).message), '; continuing execution...');
                } else {
                    throw error;
                }
            }
        }
        console.log('recreateTables -', chalk.green('finished executing table recreation script!'));
    });
}

// return player matching given playerId
export async function fetchPlayer(playerId: string): Promise<Player[]> {
    try {
        return await withOracleDB(async (connection) => {
            const sql = 'SELECT * FROM Player WHERE playerId = :playerId';
            const vals = [playerId];
            console.log('fetchPlayer - executing', chalk.cyan(sql), 'with vals', chalk.cyanBright(vals));
            const res = await connection.execute(sql, vals);
            return res.rows;
        });
    } catch (error) {
        throw error;
    }
}

// return all beatmapsets with bpm within range
export async function fetchBeatmapSets(bpmLowerBound: number, bpmUpperBound: number): Promise<BeatmapSetExtended[]> {
    try {
        return await withOracleDB(async (connection) => {
            const sql = `SELECT bs.beatmapSetId, bs.creationDate, bs.mapperId, bs.songId, p.username, s.bpm, s.genre, s.name, a.name
                         FROM BeatmapSet bs
                         JOIN Player p on bs.mapperId = p.playerId
                         JOIN Song s ON bs.songId = s.songId
                         JOIN Artist a ON s.artistId = a.artistId
                         WHERE s.bpm > :lowerBound AND s.bpm < :upperBound`;
            const vals = {
                lowerBound: (isNaN(bpmLowerBound) ? Number.MIN_SAFE_INTEGER : bpmLowerBound),
                upperBound: (isNaN(bpmUpperBound) ? Number.MAX_SAFE_INTEGER : bpmUpperBound)
            };
            console.log('fetchBeatmapSets - executing', chalk.cyan(sql), 'with vals', chalk.cyanBright(vals));
            const res = await connection.execute(sql, vals);
            return res.rows;
        });
    } catch (error) {
        throw error;
    }
}

// return beatmapset matching given beatmapSetId
export async function fetchBeatmapSet(beatmapSetId: string): Promise<BeatmapSetExtended[]> {
    try {
        return await withOracleDB(async (connection) => {
            const sql = `SELECT bs.beatmapSetId, bs.creationDate, bs.mapperId, bs.songId, p.username, s.bpm, s.genre, s.name, a.name
                         FROM BeatmapSet bs
                         JOIN Player p ON bs.mapperId = p.playerId
                         JOIN Song s ON bs.songId = s.songId
                         JOIN Artist a ON s.artistId = a.artistId
                         WHERE bs.beatmapSetId = :beatmapSetId`;
            const vals = [beatmapSetId];
            console.log('fetchBeatmapSet - executing', chalk.cyan(sql), 'with vals', chalk.cyanBright(vals));
            const res = await connection.execute(sql, vals);
            return res.rows;
        });
    } catch (error) {
        throw error;
    }
}

// delete beatmapset matching given beatmapSetId (return num. rows affected)
export async function removeBeatmapSet(beatmapSetId: string): Promise<number> {
    try {
        return await withOracleDB(async (connection) => {
            const sql = 'DELETE FROM BeatmapSet WHERE beatmapSetId = :beatmapSetId';
            const vals = [beatmapSetId];
            console.log('removeBeatmapSet - executing', chalk.cyan(sql), 'with vals', chalk.cyanBright(vals));
            const res = await connection.execute(sql, vals, { autoCommit: true });
            return res.rowsAffected;
        });
    } catch (error) {
        throw error;
    }
}

// add beatmapset and any associated rows in foreign tables (given all relevant fields)
export async function addBeatmapSetManual(bsr: BeatmapSetPUTRequestBodyManual) {
    try {
        return await withOracleDB(async (connection) => {
            let rowsAffected = 0;
            // check if mapper/player doesn't exist
            const mapperSelectSql = 'SELECT playerId FROM Player WHERE playerId = :playerId';
            const mapperSelectVals = [bsr.beatmapSet.mapperId];
            const mapperSelectRes = await connection.execute(mapperSelectSql, mapperSelectVals);
            if ((mapperSelectRes.rows as any[]).length < 1) {
                // check if country doesn't exist
                const countrySelectSql = 'SELECT countryName FROM Country WHERE countryName = :countryName';
                const countrySelectVals = [bsr.mapper.countryName];
                const countrySelectRes = await connection.execute(countrySelectSql, countrySelectVals);
                if ((countrySelectRes.rows as any[]).length < 1) {
                    // insert country
                    const countryInsertSql = 'INSERT INTO Country VALUES(:countryName, EMPTY_BLOB())'; // TODO: flag BLOBs
                    const countryInsertVals = [bsr.mapper.countryName];
                    const countryInsertRes = await connection.execute(countryInsertSql, countryInsertVals, { autoCommit: true });
                    rowsAffected += countryInsertRes.rowsAffected!;
                }
                // insert mapper/player
                const mapperInsertSql = 'INSERT INTO Player VALUES(:playerId, :rank, :username, :joinDate, :countryName)';
                const mapperInsertVals = [bsr.beatmapSet.mapperId, bsr.mapper.rank, bsr.mapper.username, new Date(bsr.mapper.joinDate), bsr.mapper.countryName];
                const mapperInsertRes = await connection.execute(mapperInsertSql, mapperInsertVals, { autoCommit: true });
                rowsAffected += mapperInsertRes.rowsAffected!;
            }
            // check if song doesn't exist
            const songSelectSql = 'SELECT songId FROM Song WHERE songId = :songId';
            const songSelectVals = [bsr.beatmapSet.songId];
            const songSelectRes = await connection.execute(songSelectSql, songSelectVals);
            if ((songSelectRes.rows as any[]).length < 1) {
                // check if artist doesn't exist
                const artistSelectSql = 'SELECT artistId FROM Artist WHERE artistId = :artistId';
                const artistSelectVals = [bsr.song.artistId];
                const artistSelectRes = await connection.execute(artistSelectSql, artistSelectVals);
                if ((artistSelectRes.rows as any[]).length < 1) {
                    // insert artist
                    const artistInsertSql = 'INSERT INTO Artist VALUES(:artistId, :isFeatured, :name)';
                    const artistInsertVals = [bsr.song.artistId, (bsr.songArtist.isFeatured ? "Y" : "N"), bsr.songArtist.name];
                    const artistInsertRes = await connection.execute(artistInsertSql, artistInsertVals, { autoCommit: true });
                    rowsAffected += artistInsertRes.rowsAffected!;
                }
                // insert song
                const songInsertSql = 'INSERT INTO Song VALUES(:songId, :bpm, :genre, :name, :artistId)';
                const songInsertVals = [bsr.beatmapSet.songId, bsr.song.bpm, bsr.song.genre, bsr.song.name, bsr.song.artistId];
                const songInsertRes = await connection.execute(songInsertSql, songInsertVals, { autoCommit: true });
                rowsAffected += songInsertRes.rowsAffected!;
            }
            // check if beatmapset doesn't exist
            const beatmapSetSelectSql = 'SELECT beatmapSetId FROM BeatmapSet WHERE beatmapSetId = :beatmapSetId';
            const beatmapSetSelectVals = [bsr.beatmapSet.beatmapSetId];
            const beatmapSetSelectRes = await connection.execute(beatmapSetSelectSql, beatmapSetSelectVals);
            if ((beatmapSetSelectRes.rows as any[]).length < 1) {
                // insert beatmapset
                const beatmapsetInsertSql = 'INSERT INTO BeatmapSet VALUES(:beatmapSetId, :creationDate, :mapperId, :songId)';
                const beatmapsetInsertVals = [bsr.beatmapSet.beatmapSetId, new Date(bsr.beatmapSet.creationDate), bsr.beatmapSet.mapperId, bsr.beatmapSet.songId];
                const beatmapsetInsertRes = await connection.execute(beatmapsetInsertSql, beatmapsetInsertVals, { autoCommit: true });
                rowsAffected += beatmapsetInsertRes.rowsAffected!;
            }
            return rowsAffected;
        });
    } catch (error) {
        throw error;
    }
}

// add beatmapset and any associated rows in foreign tables (only given beatmapset id)
export async function addBeatmapSetAuto(beatmapSetId: number): Promise<number> {
    try {
        if (!osu) {
            throw Error("addBeatmapSetAuto - osu is null");
        }
        const beatmapSet = await osu.getBeatmapSet(beatmapSetId);
        const user = await osu.getUser(beatmapSet.user.username, 'username');
        return await withOracleDB(async (connection) => {
            let rowsAffected = 0;

            // insert country if doesn't exist
            const countrySql = `INSERT INTO Country (countryName, flag)
                                SELECT :countryName, EMPTY_BLOB()
                                FROM dual
                                WHERE NOT EXISTS (
                                    SELECT 1
                                    FROM Country
                                    WHERE countryName = :countryName
                                )`; // TODO: flag BLOBs
            const countryVals = { countryName: user.country.name };
            const countryRes = await connection.execute(countrySql, countryVals, { autoCommit: true });
            rowsAffected += countryRes.rowsAffected!;

            // insert artist if doesn't exist
            const latestArtistIdRes = await connection.execute('SELECT MAX(artistId) FROM Artist', []);
            let artistId = Number((latestArtistIdRes.rows as any[])[0][0]) + 1;
            const artistSql = `INSERT INTO Artist (artistId, isFeatured, name)
                               SELECT :artistId, 'N', :name
                               FROM dual
                               WHERE NOT EXISTS (
                                    SELECT 1
                                    FROM Artist
                                    WHERE name = :name
                               )`;
            const artistVals = { artistId: artistId, name: beatmapSet.artist };
            const artistRes = await connection.execute(artistSql, artistVals, { autoCommit: true });
            rowsAffected += artistRes.rowsAffected!;
            if (artistRes.rowsAffected! === 0) {
                const artistIdSql = `SELECT artistId FROM Artist WHERE name = :name`;
                const artistIdVals = { name: beatmapSet.artist };
                const artistIdRes = await connection.execute(artistIdSql, artistIdVals);
                artistId = (artistIdRes.rows as any[])[0][0];
            }

            // insert mapper if doesn't exist
            const mapperSql = `INSERT INTO Player (playerId, rank, username, joinDate, countryName)
                               SELECT :playerId, :rank, :username, :joinDate, :countryName
                               FROM dual
                               WHERE NOT EXISTS (
                                    SELECT 1
                                    FROM Player
                                    WHERE playerId = :playerId
                               )`;
            const mapperVals = {
                playerId: user.id,
                rank: user.statistics.global_rank,
                username: user.username,
                joinDate: new Date(user.join_date),
                countryName: user.country.name
            };
            const mapperRes = await connection.execute(mapperSql, mapperVals, { autoCommit: true });
            rowsAffected += mapperRes.rowsAffected!;

            // insert song if doesn't exist
            const latestSongIdRes = await connection.execute('SELECT MAX(songId) FROM Song', []);
            let songId = Number((latestSongIdRes.rows as any[])[0][0]) + 1;
            const songSql = `INSERT INTO Song (songId, bpm, genre, name, artistId)
                             SELECT :songId, :bpm, :genre, :name, :artistId
                             FROM dual
                             WHERE NOT EXISTS (
                                SELECT 1
                                FROM Song
                                WHERE name = :name
                             )`;
            const songVals = {
                songId: songId,
                bpm: beatmapSet.beatmaps[0].bpm,
                genre: beatmapSet.genre.name,
                name: beatmapSet.title,
                artistId: artistId
            };
            const songRes = await connection.execute(songSql, songVals, { autoCommit: true });
            rowsAffected += songRes.rowsAffected!;
            if (songRes.rowsAffected! === 0) {
                const songIdSql = `SELECT songId FROM Song WHERE name = :name`;
                const songIdVals = { name: beatmapSet.title };
                const songIdRes = await connection.execute(songIdSql, songIdVals);
                songId = (songIdRes.rows as any[])[0][0];
            }

            // insert beatmapset if doesn't exist
            const beatmapSetSql = `INSERT INTO BeatmapSet (beatmapSetId, creationDate, mapperId, songId)
                                   SELECT :beatmapSetId, :creationDate, :mapperId, :songId
                                   FROM dual
                                   WHERE NOT EXISTS (
                                        SELECT 1
                                        FROM BeatmapSet
                                        WHERE beatmapSetId = :beatmapSetId
                                   )`;
            const beatmapSetVals = {
                beatmapSetId: beatmapSetId,
                creationDate: new Date(beatmapSet.submitted_date),
                mapperId: user.id,
                songId: songId
            };
            const beatmapSetRes = await connection.execute(beatmapSetSql, beatmapSetVals, { autoCommit: true });
            rowsAffected += beatmapSetRes.rowsAffected!;

            return rowsAffected;
        });
    } catch (error) {
        throw error;
    }
}

// add beatmap and any associated rows in foreign tables
// only works for mode=standard
export async function addBeatmap(beatmapId: string, connection: oracledb.Connection): Promise<number> {
    try {
        if (!osu) {
            throw Error("addBeatmap - osu is null");
        }
        const beatmap = await osu.getBeatmap(Number(beatmapId));
        if (beatmap === undefined) return 0;
        const beatmapAttributes = await osu.getBeatmapAttributes(Number(beatmapId));
        let rowsAffected = 0;
        // insert beatmapset if doesn't exist
        rowsAffected += await addBeatmapSetAuto(beatmap.beatmapset_id);
        // insert beatmaphitobjects if doesn't exist
        const hitObjsSql = `INSERT INTO BeatmapHitObjects (hitObjectsUrl, maxCombo, hpDrain, stars)
                            SELECT :hitObjectsUrl, :maxCombo, :hpDrain, :stars
                            FROM dual
                            WHERE NOT EXISTS (
                                SELECT 1
                                FROM BeatmapHitObjects
                                WHERE hitObjectsUrl = :hitObjectsUrl)`;
        const hitObjsVal = {
            hitObjectsUrl: `https://osu.ppy.sh/beatmapsets/${beatmap.beatmapset_id}/download`,
            maxCombo: beatmapAttributes.attributes.max_combo,
            hpDrain: beatmap.drain,
            stars: beatmap.difficulty_rating
        };
        const hitObjsRes = await connection.execute(hitObjsSql, hitObjsVal, { autoCommit: true });
        rowsAffected += hitObjsRes.rowsAffected!;
        // insert beatmap if doesn't exist
        const beatmapSql = `INSERT INTO Beatmap (beatmapSetId, difficultyName, maxCombo, hpDrain, hitObjectsUrl, mapperId)
                            SELECT :beatmapSetId, :difficultyName, :maxCombo, :hpDrain, :hitObjectsUrl, :mapperId
                            FROM dual
                            WHERE NOT EXISTS (
                                SELECT 1
                                FROM Beatmap
                                WHERE beatmapSetId = :beatmapSetId AND difficultyName = :difficultyName
                            )`;
        const beatmapVals = {
            beatmapSetId: beatmap.beatmapset_id,
            difficultyName: beatmap.version,
            maxCombo: beatmapAttributes.attributes.max_combo,
            hpDrain: beatmap.drain,
            hitObjectsUrl: `https://osu.ppy.sh/beatmapsets/${beatmap.beatmapset_id}/download`,
            mapperId: beatmap.beatmapset.user_id
        };
        const beatmapRes = await connection.execute(beatmapSql, beatmapVals, { autoCommit: true });
        rowsAffected += beatmapRes.rowsAffected!;
        return rowsAffected;
    } catch (error) {
        throw error;
    }
}

// update beatmapset corresponding to given id with given params
export async function updateBeatmapSet(beatmapSetId: string, body: BeatmapSetPOSTRequestBody): Promise<number> {
    try {
        return await withOracleDB(async (connection) => {
            if ((body.creationDate === null) && (body.mapperId === null) && (body.songId === null)) {
                throw new Error("invalid body; at least one field must not be null")
            }
            let sql = 'UPDATE BeatmapSet SET ';
            let vals: any[] = [];
            if (body.creationDate !== null) {
                sql += 'creationDate = :creationDate, ';
                vals.push(new Date(body.creationDate));
            }
            if (body.mapperId !== null) {
                sql += 'mapperId = :mapperId, ';
                vals.push(body.mapperId);
            }
            if (body.songId !== null) {
                sql += 'songId = :songId, ';
                vals.push(body.songId);
            }
            sql = sql.slice(0, -2);
            sql += ' WHERE beatmapSetId = :beatmapSetId';
            vals.push(beatmapSetId);
            console.log('updateBeatmapSet - executing', chalk.cyan(sql), 'with vals', chalk.cyanBright(vals));
            const res = await connection.execute(sql, vals, { autoCommit: true });
            return res.rowsAffected;
        });
    } catch (error) {
        throw error;
    }
}

// return rows of given table corresponding to specified attributes
export async function fetchTable(tableName: string, attributes: string | undefined): Promise<any[]> {
    try {
        return await withOracleDB(async (connection) => {
            // sanitize inputs
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
                throw new Error(`Invalid table name: "${tableName}"`);
            }
            let sql = '';
            if (attributes === undefined) {
                sql = `SELECT * FROM ${tableName}`;
            } else {
                const attributeList = attributes.split(',');
                // sanitize inputs
                for (const attribute of attributeList) {
                    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(attribute)) {
                        throw new Error(`Invalid attribute: "${attribute}"`);
                    }
                }
                sql = `SELECT ${attributeList.join(', ')} FROM ${tableName}`;
            }
            console.log('fetchTable - executing', chalk.cyan(sql));
            const res = await connection.execute(sql, []);
            return res.rows;
        });
    } catch (error) {
        throw error;
    }
}

// return players with avg score greater than given score
export async function fetchPlayersAvgScoreGreaterThan(lowerBound: string | undefined): Promise<PlayerAvgScore[]> {
    try {
        return await withOracleDB(async (connection) => {
            const lb = Number(lowerBound);
            if (isNaN(lb)) {
                throw new Error(`${lowerBound} is not a valid number!`);
            }
            const sql = `SELECT p.playerId, p.username, AVG(s.totalScore) AS avgScore
                         FROM Score s
                         JOIN Player p ON s.playerId = p.playerId
                         GROUP BY p.playerId, p.username
                         HAVING AVG(s.totalScore) > :lb`;
            const vals = [lb];
            console.log('fetchPlayersAvgScoreGreaterThan - executing', chalk.cyan(sql), 'with vals', vals);
            const res = await connection.execute(sql, vals);
            return res.rows;
        });
    } catch (error) {
        throw error;
    }
}

// return primary key of given table
// from https://stackoverflow.com/questions/9016578/how-to-get-primary-key-column-in-oracle
export async function fetchKey(tableName: string): Promise<string[]> {
    try {
        return await withOracleDB(async (connection) => {
            const sql = `SELECT cols.column_name
                         FROM all_constraints cons, all_cons_columns cols
                         WHERE cols.table_name = :tableName
                            AND cons.constraint_type = 'P'
                            AND cons.constraint_name = cols.constraint_name
                            AND cons.owner = cols.owner
                            AND cons.owner = '${Config.ORACLE_USER.toUpperCase()}'
                         ORDER BY cols.table_name, cols.position`;
            const vals = [tableName.toUpperCase()];
            console.log('fetchKey - executing', chalk.cyan(sql), 'with vals', vals);
            const res = await connection.execute(sql, vals);
            return (res.rows as string[]).flat();
        });
    } catch (error) {
        throw error;
    }
}

// return average accuracies of players
export async function fetchPlayersAvgAccuracy(playerId: string | undefined): Promise<PlayerAvgAccuracy[]> {
    try {
        return await withOracleDB(async (connection) => {
            const pid = Number(playerId); // implicitly sanitizes
            let avgAccSql = `SELECT p.playerId, p.username, AVG(accuracy) AS avgAcc
                         FROM Score s
                         JOIN Player p ON s.playerId = p.playerId
                         GROUP BY p.playerId, p.username`;
            console.log('fetchPlayersAvgAccuracy - executing', chalk.cyan(avgAccSql));
            const avgAccRes = await connection.execute(avgAccSql, []);
            const players = await fetchTable('Player', 'playerId,username');
            for (const player of players) {
                if (!avgAccRes.rows!.some((row: any) => row[0] === player[0])) {
                    avgAccRes.rows!.push([player[0], player[1], null]);
                }
            }
            if (isNaN(pid)) {
                return avgAccRes.rows;
            } else {
                return avgAccRes.rows!.find((row: any) => row[0] === pid);
            }
        });
    } catch (error) {
        throw error;
    }
}

// return max of average accuracies per mod
export async function fetchMaxAvgAccPerMod(): Promise<number[]> {
    try {
        return await withOracleDB(async (connection) => {
            const sql = `WITH mod_avg_accuracies AS (
                            SELECT modifier, AVG(accuracy) AS avg_accuracy
                            FROM Score
                            GROUP BY modifier
                        ),
                        max_avg AS (
                            SELECT MAX(avg_accuracy) AS max_avg_accuracy
                            FROM mod_avg_accuracies
                        )
                        SELECT maa.modifier, maa.avg_accuracy AS max_avg_accuracy
                        FROM mod_avg_accuracies maa
                        JOIN max_avg mavg
                        ON maa.avg_accuracy = mavg.max_avg_accuracy`;
            console.log('fetchMaxAvgAccPerMod - executing', chalk.cyan(sql));
            const res = await connection.execute(sql, []);
            return res.rows;
        });
    } catch (error) {
        throw error;
    }
}

// return rows of table corresponding to filtered conditions
export async function fetchWithFilters(tableName: string, filters: string): Promise<any[]> {
    try {
        return await withOracleDB(async (connection) => {
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
                throw new Error(`Invalid table name: "${tableName}"`);
            } 
            const conditions = parseFilters(filters);
            const sql = `SELECT * FROM ${tableName} WHERE ${conditions}`;
            console.log('fetchWithFilters - executing', chalk.cyan(sql));
            const res = await connection.execute(sql);
            return res.rows;
        });
    } catch (error) {
        throw error;
    }
}

//  parse filters and construct SQL WHERE clause
function parseFilters(filters: string): string {
    // basic parsing logic
    if (!/[a-zA-Z0-9]+|(\|\|)|(==)|(&&)|(')|(<)|(>)|(<=)|(>=)|(<>)|(!=)/.test(filters)) throw new Error(`Invalid filters: "${filters}"`);
    return filters
        .replace(/==/g, '=')
        .replace(/\|\|/g, ' OR ')
        .replace(/&&/g, ' AND ');
}

// returns all table names
export async function fetchTableNames(): Promise<string[]> {
    try {
        return await withOracleDB(async (connection) => {
            const sql = `SELECT table_name
                         FROM all_tables
                         WHERE owner = '${Config.ORACLE_USER.toUpperCase()}'`;
            console.log('fetchTableNames - executing', chalk.cyan(sql));
            const res = await connection.execute(sql);
            return (res.rows as string[]).flat(); 
        });
    } catch (error) {
        console.error('fetchTableNames - caught', chalk.red(error));
        throw error;
    }
}

// returns attributes of table
export async function fetchColumnNames(tableName: string): Promise<string[]> {
    try {
        return await withOracleDB(async (connection) => {
            const sql = `SELECT column_name
                         FROM all_tab_columns
                         WHERE table_name = :tableName
                            AND owner = '${Config.ORACLE_USER.toUpperCase()}'`;

            const vals = [tableName.toUpperCase()];
            console.log('fetchColumnNames - executing', chalk.cyan(sql), 'with vals', chalk.cyanBright(vals));
            const res = await connection.execute(sql, vals);
            return (res.rows as string[]).flat(); 
        });
    } catch (error) {
        console.error('fetchColumnNames - caught', chalk.red(error));
        throw error;
    }
}

// add match and any associated rows in foreign tables
export async function addMatch(body: MatchPUTRequestBody): Promise<number> {
    try {
        if (!osu) { throw new Error('addMatch - osu is null'); }
        const events = await osu.getMatchEvents(body.matchId);
        const gameEvents = events.filter(event => event.game !== undefined);
        gameEvents.splice(0, body.numWarmups);

        return await withOracleDB(async (connection) => {
            let rowsAffected = 0;
            // insert match
            const matchSql = `INSERT INTO Match (matchId, round, tournamentId)
                              SELECT :matchId, :round, :tournamentId
                              FROM dual
                              WHERE NOT EXISTS (
                                SELECT 1
                                FROM Match
                                WHERE matchId = :matchId)`;
            const matchVals = {
                matchId: body.matchId,
                round: gameEvents[0].detail.text,
                tournamentId: body.tournamentId
            };
            const matchRes = await connection.execute(matchSql, matchVals, { autoCommit: true });
            rowsAffected += matchRes.rowsAffected!;

            // loop over scores from each map played
            for (const gameEvent of gameEvents) {
                // insert beatmap set and any associated rows in foreign tables
                const addBeatmapRes = await addBeatmap(gameEvent.game.beatmap_id, connection);
                if (addBeatmapRes === 0) continue;
                rowsAffected += addBeatmapRes;
                for (const score of gameEvent.game.scores) {
                    if (!osu) { throw new Error('addMatch - osu is null'); }
                    const user = await osu.getUser(score.user_id, 'id');
                    // insert country if doesn't exist
                    const countrySql = `INSERT INTO Country (countryName, flag)
                                        SELECT :countryName, EMPTY_BLOB()
                                        FROM dual
                                        WHERE NOT EXISTS (
                                            SELECT 1
                                            FROM Country
                                            WHERE countryName = :countryName
                                        )`; // TODO: flag BLOBs
                    const countryVals = { countryName: user.country.name };
                    const countryRes = await connection.execute(countrySql, countryVals, { autoCommit: true });
                    rowsAffected += countryRes.rowsAffected!;

                    // insert player if doesn't exist
                    const playerSql = `INSERT INTO Player (playerId, rank, username, joinDate, countryName)
                                       SELECT :playerId, :rank, :username, :joinDate, :countryName
                                       FROM dual
                                       WHERE NOT EXISTS (
                                            SELECT 1
                                            FROM Player
                                            WHERE playerId = :playerId
                                       )`;
                    const playerVals = {
                        playerId: user.id,
                        rank: user.statistics.global_rank,
                        username: user.username,
                        joinDate: new Date(user.join_date),
                        countryName: user.country.name
                    };
                    const playerRes = await connection.execute(playerSql, playerVals, { autoCommit: true });
                    rowsAffected += playerRes.rowsAffected!;

                    // insert score if doesn't exist
                    const latestScoreIdRes = await connection.execute('SELECT MAX(scoreId) FROM Score', []);
                    const scoreId = Number((latestScoreIdRes.rows as any[])[0][0]) + 1;
                    const scoreSql = `INSERT INTO Score (scoreId, modifier, totalScore, combo, accuracy, dateSet, playerId, beatmapSetId, difficultyName, matchId)
                                      SELECT :scoreId, :modifier, :totalScore, :combo, :accuracy, :dateSet, :playerId, :beatmapSetId, :difficultyName, :matchId
                                      FROM dual
                                      WHERE NOT EXISTS (
                                        SELECT 1
                                        FROM Score
                                        WHERE scoreId = :scoreId
                                      )`;
                    const scoreVals = {
                        scoreId: scoreId,
                        modifier: score.mods.join(''),
                        totalScore: score.score,
                        combo: score.max_combo,
                        accuracy: score.accuracy,
                        dateSet: new Date(score.created_at),
                        playerId: score.user_id,
                        beatmapSetId: gameEvent.game.beatmap.beatmapset_id,
                        difficultyName: gameEvent.game.beatmap.version,
                        matchId: body.matchId
                    };
                    const scoreRes = await connection.execute(scoreSql, scoreVals, { autoCommit: true });
                    rowsAffected += scoreRes.rowsAffected!;
                }
            }
            return rowsAffected;
        });
    } catch (error) {
        console.error('addMatch - caught', chalk.red(error));
        throw error;
    }
}

//returns players that have a score in ALL beatmaps
export async function fetchPlayersWithAllBeatmaps(): Promise<string[]> {
    try {
        return await withOracleDB(async (connection) => {
            const sql = `
                SELECT playerId
                FROM Score
                WHERE beatmapSetID IN (
                    SELECT beatmapSetId
                    FROM Standard
                )
                GROUP BY playerId
                HAVING COUNT(DISTINCT beatmapSetId) = (
                    SELECT COUNT(*)
                    FROM Standard
                )
            `;
            console.log('fetchPlayersWithAllBeatmaps - executing', chalk.cyan(sql));
            const res = await connection.execute(sql);
            let players = [];
            for (const playerId of (res.rows as string[]).flat()) {
                const playerSql = 'SELECT * FROM Player WHERE playerId = :playerId';
                const playerRes = await connection.execute(playerSql, [playerId]);
                players.push(playerRes.rows![0]);
            }
            return players;
        });
    } catch (error) {
        console.error('fetchPlayersWithAllBeatmaps - caught', chalk.red(error));
        throw error;
    }
}

export async function addSong(song: SongPUTRequestBody): Promise<number> {
    try {
        return await withOracleDB(async (connection) => {
            let rowsAffected = 0;
            // check if artist doesn't exist
            const artistSelectSql = 'SELECT name FROM Artist WHERE name = :name';
            const artistSelectVals = { name: song.artistName };
            const artistSelectRes = await connection.execute(artistSelectSql, artistSelectVals);
            if ((artistSelectRes.rows as any[]).length < 1) {
                // insert artist
                const latestArtistIdRes = await connection.execute('SELECT MAX(artistId) FROM Artist', []);
                const artistInsertSql = 'INSERT INTO Artist VALUES(:artistId, :isFeatured, :name)';
                const artistInsertVals = {
                    artistId: Number((latestArtistIdRes.rows as any[])[0][0]) + 1,
                    isFeatured: (song.artistIsFeatured ? 'Y' : 'N'),
                    name: song.artistName
                };
                const artistInsertRes = await connection.execute(artistInsertSql, artistInsertVals, { autoCommit: true });
                rowsAffected += artistInsertRes.rowsAffected!;
            }
            // insert song
            const artistIdRes = await connection.execute('SELECT artistId FROM Artist WHERE name = :name', [song.artistName]);
            const latestSongIdRes = await connection.execute('SELECT MAX(songId) FROM Song', []);
            const songInsertSql = 'INSERT INTO Song VALUES(:songId, :bpm, :genre, :name, :artistId)';
            const songInsertVals = {
                songId: Number((latestSongIdRes.rows as any[])[0][0]) + 1,
                bpm: song.bpm,
                genre: song.genre,
                name: song.name,
                artistId: Number((artistIdRes.rows as any[])[0][0])
            };
            const songInsertRes = await connection.execute(songInsertSql, songInsertVals, { autoCommit: true });
            rowsAffected += songInsertRes.rowsAffected!;
            return rowsAffected;
        });
    } catch (error) {
        console.error('addSong - caught', chalk.red(error));
        throw error;
    }
}
