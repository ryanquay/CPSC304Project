ALTER SESSION SET NLS_DATE_FORMAT='YYYY-MM-DD';

--Drop all tables

DROP TABLE Artist CASCADE CONSTRAINTS;
DROP TABLE Song CASCADE CONSTRAINTS;
DROP TABLE Beatmap CASCADE CONSTRAINTS;
DROP TABLE BeatmapSet CASCADE CONSTRAINTS;
DROP TABLE BeatMapHitObjects CASCADE CONSTRAINTS;
DROP TABLE Player CASCADE CONSTRAINTS;
DROP TABLE Standard CASCADE CONSTRAINTS;
DROP TABLE Taiko CASCADE CONSTRAINTS;
DROP TABLE Mania CASCADE CONSTRAINTS;
DROP TABLE Score CASCADE CONSTRAINTS;
DROP TABLE Match CASCADE CONSTRAINTS;
DROP TABLE Tournament CASCADE CONSTRAINTS;
DROP TABLE TournamentBadge CASCADE CONSTRAINTS;
DROP TABLE Country CASCADE CONSTRAINTS;

--Create tables

CREATE TABLE Artist (
    artistId INTEGER,
    isFeatured CHAR(1) NOT NULL,
    name VARCHAR(32) NOT NULL,
    UNIQUE (name),
    PRIMARY KEY (artistId)
);

CREATE TABLE Country (
    countryName VARCHAR(32),
    flag BLOB NOT NULL,
    PRIMARY KEY (countryName)
);

CREATE TABLE TournamentBadge (
    badgeUrl VARCHAR(256),
    badgeIssueDate DATE NOT NULL,
    PRIMARY KEY (badgeUrl)
);

CREATE TABLE BeatmapHitObjects (
    hitObjectsUrl VARCHAR(256),
    maxCombo INTEGER NOT NULL,
    hpDrain FLOAT NOT NULL,
    stars FLOAT NOT NULL,
    PRIMARY KEY (hitObjectsUrl)
);

CREATE TABLE Player (
    playerId INTEGER,
    rank INTEGER,
    username VARCHAR(32) NOT NULL,
    joinDate DATE NOT NULL,
    countryName VARCHAR(32) NOT NULL,
    UNIQUE (username),
    PRIMARY KEY (playerId),
    FOREIGN KEY (countryName) REFERENCES Country (countryName)
);

CREATE TABLE Song (
    songId INTEGER,
    bpm INTEGER NOT NULL,
    genre VARCHAR(32),
    name VARCHAR(128) NOT NULL,
    artistId INTEGER NOT NULL,
    UNIQUE (name),
    PRIMARY KEY (songId),
    FOREIGN KEY (artistId) REFERENCES Artist(artistId)
);

CREATE TABLE Tournament (
    tournamentId INTEGER,
    name VARCHAR(64) NOT NULL,
    lowerRankBound INTEGER,
    upperRankBound INTEGER,
    startDate DATE NOT NULL,
    badgeUrl VARCHAR(256),
    countryName VARCHAR(32),
    PRIMARY KEY (tournamentId),
    FOREIGN KEY (countryName) REFERENCES Country (countryName),
    FOREIGN KEY (badgeUrl) REFERENCES TournamentBadge (badgeUrl)
);

CREATE TABLE Match (
    matchId INTEGER,
    round VARCHAR(128) NOT NULL,
    tournamentId INT NOT NULL,
    PRIMARY KEY (matchId),
    FOREIGN KEY (tournamentId) REFERENCES Tournament(tournamentId)
);

CREATE TABLE BeatmapSet (
    beatmapSetId INTEGER,
    creationDate DATE NOT NULL,
    mapperId INTEGER NOT NULL,
    songId INTEGER NOT NULL,
    PRIMARY KEY (beatmapSetId),
    FOREIGN KEY (mapperId) REFERENCES Player(playerId),
    FOREIGN KEY (songId) REFERENCES Song(songId)
);

CREATE TABLE Beatmap (
    beatmapSetId INTEGER,
    difficultyName VARCHAR(64),
    maxCombo INTEGER NOT NULL,
    hpDrain FLOAT NOT NULL,
    hitObjectsUrl VARCHAR(256) NOT NULL,
    mapperId INTEGER NOT NULL,
    PRIMARY KEY (beatmapSetId, difficultyName),
    FOREIGN KEY (beatmapSetId) REFERENCES BeatmapSet(beatmapSetId) ON DELETE CASCADE,
    FOREIGN KEY (mapperId) REFERENCES Player(playerId),
    FOREIGN KEY (hitObjectsUrl) REFERENCES BeatmapHitObjects(hitObjectsUrl)
);

CREATE TABLE Standard (
    beatmapSetId INTEGER,
    difficultyName VARCHAR(64),
    circleSize FLOAT NOT NULL,
    PRIMARY KEY (beatmapSetId, difficultyName),
    FOREIGN KEY (beatmapSetId, difficultyName) REFERENCES Beatmap(beatmapSetId, difficultyName) ON DELETE CASCADE
);

CREATE TABLE Taiko (
    beatmapSetId INTEGER,
    difficultyName VARCHAR(64),
    drumSpeed FLOAT NOT NULL,
    PRIMARY KEY (beatmapSetId, difficultyName),
    FOREIGN KEY (beatmapSetId, difficultyName) REFERENCES Beatmap(beatmapSetId, difficultyName) ON DELETE CASCADE
);

CREATE TABLE Mania (
    beatmapSetId INTEGER,
    difficultyName VARCHAR(64),
    keyCount INTEGER NOT NULL,
    PRIMARY KEY (beatmapSetId, difficultyName),
    FOREIGN KEY (beatmapSetId, difficultyName) REFERENCES Beatmap(beatmapSetId, difficultyName) ON DELETE CASCADE
);

CREATE TABLE Score (
    scoreId INTEGER,
    modifier VARCHAR(8),
    totalScore INTEGER,
    combo INTEGER NOT NULL,
    accuracy FLOAT NOT NULL,
    dateSet DATE NOT NULL,
    playerId INTEGER NOT NULL,
    beatmapSetId INTEGER NOT NULL,
    difficultyName VARCHAR(64) NOT NULL,
    matchId INTEGER NOT NULL,
    PRIMARY KEY (scoreId),
    FOREIGN KEY (playerId) REFERENCES Player(playerId),
    FOREIGN KEY (beatmapSetId, difficultyName) REFERENCES Beatmap(beatmapSetId, difficultyName) ON DELETE CASCADE,
    FOREIGN KEY (matchId) REFERENCES Match(matchId)
);


--Insert values

INSERT INTO Artist VALUES(0, 'Y', 'Kommisar');
INSERT INTO Artist VALUES(1, 'Y', 'ZxNX');
INSERT INTO Artist VALUES(2, 'Y', 'Aether');
INSERT INTO Artist VALUES(3, 'N', 'Denkishiki Karen Ongaku Shuudan');
INSERT INTO Artist VALUES(4, 'N', 'Noah');
INSERT INTO Artist VALUES(5, 'Y', 'Silentroom');
INSERT INTO Artist VALUES(6, 'Y', 'Marmalade butcher');
INSERT INTO Artist VALUES(7, 'Y', 'Sobrem');
INSERT INTO Artist VALUES(8, 'Y', 'II-L');
INSERT INTO Artist VALUES(9, 'Y', 'katagiri');
INSERT INTO Artist VALUES(10, 'Y', 'Frums');
INSERT INTO Artist VALUES(11, 'Y', 'Camellia');
INSERT INTO Artist VALUES(12, 'N', 'ROKINA');
INSERT INTO Artist VALUES(13, 'N', 'Wolpis Carter');
INSERT INTO Artist VALUES(14, 'N', 'SDMNE');

--TODO: Replace stubbed BLOBs
INSERT INTO Country VALUES('United States', EMPTY_BLOB());
INSERT INTO Country VALUES('Australia', EMPTY_BLOB());
INSERT INTO Country VALUES('Japan', EMPTY_BLOB());
INSERT INTO Country VALUES('Taiwan', EMPTY_BLOB());
INSERT INTO Country VALUES('Canada', EMPTY_BLOB());
INSERT INTO Country VALUES('United Kingdom', EMPTY_BLOB());
INSERT INTO Country VALUES('Russian Federation', EMPTY_BLOB());
INSERT INTO Country VALUES('France', EMPTY_BLOB());
INSERT INTO Country VALUES('Brazil', EMPTY_BLOB());
INSERT INTO Country VALUES('South Korea', EMPTY_BLOB());
INSERT INTO Country VALUES('Germany', EMPTY_BLOB());

INSERT INTO TournamentBadge VALUES('https://assets.ppy.sh/profile-badges/owc2023-winner.png', '2023-12-02');
INSERT INTO TournamentBadge VALUES('https://assets.ppy.sh/profile-badges/otwc-2nd-2023.png', '2023-04-30');
INSERT INTO TournamentBadge VALUES('https://assets.ppy.sh/profile-badges/mwc7k2023-winner.png', '2023-02-21');
INSERT INTO TournamentBadge VALUES('https://assets.ppy.sh/profile-badges/OCL10.png', '2024-01-15');
INSERT INTO TournamentBadge VALUES('https://assets.ppy.sh/profile-badges/oubc-2022.png', '2022-10-07');

INSERT INTO BeatmapHitObjects VALUES('https://osu.ppy.sh/beatmapsets/2095159/download', 1820, 5.0, 8.05);
INSERT INTO BeatmapHitObjects VALUES('https://osu.ppy.sh/beatmapsets/2095138/download', 1299, 6.0, 7.93);
INSERT INTO BeatmapHitObjects VALUES('https://osu.ppy.sh/beatmapsets/2095121/download', 1468, 4.0, 7.60);
INSERT INTO BeatmapHitObjects VALUES('https://osu.ppy.sh/beatmapsets/2095134/download', 1516, 4.0, 7.73);
INSERT INTO BeatmapHitObjects VALUES('https://osu.ppy.sh/beatmapsets/2095157/download', 1812, 5.0, 7.61);
INSERT INTO BeatmapHitObjects VALUES('https://osu.ppy.sh/beatmapsets/1980705/download', 1759, 3.0, 6.77);
INSERT INTO BeatmapHitObjects VALUES('https://osu.ppy.sh/beatmapsets/1720005/download', 2158, 5.0, 7.99);
INSERT INTO BeatmapHitObjects VALUES('https://osu.ppy.sh/beatmapsets/1980775/download', 1121, 5.0, 7.97);
INSERT INTO BeatmapHitObjects VALUES('https://osu.ppy.sh/beatmapsets/1664805/download', 1532, 6.0, 6.51);
INSERT INTO BeatmapHitObjects VALUES('https://osu.ppy.sh/beatmapsets/1980692/download', 1452, 7.0, 7.61);
INSERT INTO BeatmapHitObjects VALUES('https://osu.ppy.sh/beatmapsets/1939259/download', 6500, 8.0, 8.02);
INSERT INTO BeatmapHitObjects VALUES('https://osu.ppy.sh/beatmapsets/1939327/download', 8212, 8.0, 10.43);
INSERT INTO BeatmapHitObjects VALUES('https://osu.ppy.sh/beatmapsets/1939270/download', 3200, 8.0, 8.43);
INSERT INTO BeatmapHitObjects VALUES('https://osu.ppy.sh/beatmapsets/1657994/download', 5933, 7.0, 8.34);
INSERT INTO BeatmapHitObjects VALUES('https://osu.ppy.sh/beatmapsets/1939330/download', 8145, 8.0, 11.31);

INSERT INTO Player VALUES(7813296, 26, 'hydrogen bomb', '2016-01-23', 'United States');
INSERT INTO Player VALUES(7075211, 161, 'tekkito', '2016-09-11', 'United States');
INSERT INTO Player VALUES(4108547, 19, 'WindowLife', '2014-03-06', 'United States');
INSERT INTO Player VALUES(7562902, 2, 'mrekk', '2015-12-12', 'Australia');
INSERT INTO Player VALUES(7341183, 16, 'ASecretBox', '2015-10-30', 'Australia');
INSERT INTO Player VALUES(10466315, 362090, 'Serenhaide', '2017-07-06', 'Canada');
INSERT INTO Player VALUES(5745865, 1761554, 'Altai', '2015-01-24', 'United Kingdom');
INSERT INTO Player VALUES(4960893, 4493, 'Djulus', '2014-09-22', 'Russian Federation');
INSERT INTO Player VALUES(7715620, 8020, 'IsomirDiAngelo', '2016-01-08', 'France');
INSERT INTO Player VALUES(5194391, 8668, 'Camo', '2014-11-11', 'United States');
INSERT INTO Player VALUES(4050738, 954166, 'HiroK', '2014-02-21', 'Brazil');
INSERT INTO Player VALUES(4433058, 431048, 'sendol', '2014-05-23', 'South Korea');
INSERT INTO Player VALUES(11563671, 794865, '4sbet1', '2018-01-17', 'Japan');
INSERT INTO Player VALUES(9821194, 54068, 'Miniature Lamp', '2017-03-01', 'United States');
INSERT INTO Player VALUES(1910766, NULL, 'Nwolf', '2012-09-10', 'Germany');
INSERT INTO Player VALUES(7898495, NULL, 'Wonki', '2016-02-07', 'South Korea');
INSERT INTO Player VALUES(18219603, 2108858, 'Leeju', '2020-08-23', 'Germany');
INSERT INTO Player VALUES(3360737, NULL, 'Jinjin', '2013-09-29', 'United States');
INSERT INTO Player VALUES(2218047, NULL, 'Kim_GodSSI', '2012-12-26', 'South Korea');

INSERT INTO Song VALUES(0, 245, 'Video Game', 'AKARI BEAM CANNON LAST BOSS', 0);
INSERT INTO Song VALUES(1, 222, 'Electronic', 'Fana', 1);
INSERT INTO Song VALUES(2, 240, 'Rock', 'Lunate Elf', 2);
INSERT INTO Song VALUES(3, 264, 'Metal', 'E.E.L.S.', 3);
INSERT INTO Song VALUES(4, 223, 'Video Game', 'Necrofantasia', 4);
INSERT INTO Song VALUES(5, 174, 'Electronic', 'Shuu no Hazama', 5);
INSERT INTO Song VALUES(6, 194, 'Rock', 'Amanita', 6);
INSERT INTO Song VALUES(7, 232, 'Electronic', 'Super Macaron', 7);
INSERT INTO Song VALUES(8, 136, 'Unspecified', 'EXPLORER-4', 8);
INSERT INTO Song VALUES(9, 177, 'Unspecified', 'Angel’s Salad', 9);
INSERT INTO Song VALUES(10, 142, 'Unspecified', 'ultra-blazures', 10);
INSERT INTO Song VALUES(11, 140, 'Electronic', 'Never Gonna Give You Up (Camellia Remix)', 11);
INSERT INTO Song VALUES(12, 999, 'Video Game', 'Schwerkraft', 12);
INSERT INTO Song VALUES(13, 140, 'Rock', 'Batsubyou', 13);
INSERT INTO Song VALUES(14, 240, 'Electronic', 'Beyond the Aexis', 14);

INSERT INTO Tournament VALUES(1, 'osu! World Cup 2023', NULL, NULL, '2023-09-21', 'https://assets.ppy.sh/profile-badges/owc2023-winner.png', NULL);
INSERT INTO Tournament VALUES(2, 'osu!taiko World Cup 2023', NULL, NULL, '2023-02-16', 'https://assets.ppy.sh/profile-badges/otwc-2nd-2023.png', NULL);
INSERT INTO Tournament VALUES(3, 'osu!mania 7K World Cup 2023', NULL, NULL, '2022-12-15', 'https://assets.ppy.sh/profile-badges/mwc7k2023-winner.png', NULL);
INSERT INTO Tournament VALUES(4, 'osu!Collegiate League: 10th Edition', NULL, NULL, '2023-08-31', 'https://assets.ppy.sh/profile-badges/OCL10.png', NULL);
INSERT INTO Tournament VALUES(5, 'osu!UBC Sunset Series ’22', NULL, 100000, '2022-08-07', 'https://assets.ppy.sh/profile-badges/oubc-2022.png', NULL);

INSERT INTO Match VALUES(111534249, 'OWC2023: (Australia) VS (United States)', 1);
INSERT INTO Match VALUES(108221558, 'TWC2023: (Taiwan) VS (Germany)', 2);
INSERT INTO Match VALUES(106911235, 'MWC7K2023: (Philippines) VS (South Korea)', 3);
INSERT INTO Match VALUES(111072404, 'OCL: (HKU School of Professional and Continuing Education A) vs (Portland State University A)', 4);
INSERT INTO Match VALUES(103540083, 'UBCSS: (Ophiz) vs (ZephyrCo)', 5);

INSERT INTO BeatmapSet VALUES(2095159, '2023-11-26', 10466315, 0);
INSERT INTO BeatmapSet VALUES(2095138, '2023-11-26', 5745865, 1);
INSERT INTO BeatmapSet VALUES(2095121, '2023-11-26', 4960893, 2);
INSERT INTO BeatmapSet VALUES(2095134, '2023-11-26', 7715620, 3);
INSERT INTO BeatmapSet VALUES(2095157, '2023-11-26', 5194391, 4);
INSERT INTO BeatmapSet VALUES(1980705, '2023-04-23', 4050738, 5);
INSERT INTO BeatmapSet VALUES(1720005, '2022-03-14', 4433058, 6);
INSERT INTO BeatmapSet VALUES(1980775, '2023-04-23', 11563671, 7);
INSERT INTO BeatmapSet VALUES(1664805, '2022-01-01', 9821194, 8);
INSERT INTO BeatmapSet VALUES(1980692, '2023-04-23', 1910766, 9);
INSERT INTO BeatmapSet VALUES(1939259, '2023-02-12', 7898495, 10);
INSERT INTO BeatmapSet VALUES(1939327, '2023-02-12', 18219603, 11);
INSERT INTO BeatmapSet VALUES(1939270, '2023-02-12', 3360737, 12);
INSERT INTO BeatmapSet VALUES(1657994, '2021-12-24', 2218047, 13);
INSERT INTO BeatmapSet VALUES(1939330, '2023-02-12', 18219603, 14);

INSERT INTO Beatmap VALUES(2095159, 'TEMPORAL BLAST', 1820, 5.0, 'https://osu.ppy.sh/beatmapsets/2095159/download', 10466315);
INSERT INTO Beatmap VALUES(2095138, 'Annihilation', 1299, 6.0, 'https://osu.ppy.sh/beatmapsets/2095138/download', 5745865);
INSERT INTO Beatmap VALUES(2095121, 'Extra Stage', 1468, 4.0, 'https://osu.ppy.sh/beatmapsets/2095121/download', 4960893);
INSERT INTO Beatmap VALUES(2095134, 'Consumed', 1516, 4.0, 'https://osu.ppy.sh/beatmapsets/2095134/download', 7715620);
INSERT INTO Beatmap VALUES(2095157, 'Extra Stage', 1812, 5.0, 'https://osu.ppy.sh/beatmapsets/2095157/download', 5194391);
INSERT INTO Beatmap VALUES(1980705, 'Hell Oni', 1759, 3.0, 'https://osu.ppy.sh/beatmapsets/1980705/download', 4050738);
INSERT INTO Beatmap VALUES(1720005, 'X', 2158, 5.0, 'https://osu.ppy.sh/beatmapsets/1720005/download', 4433058);
INSERT INTO Beatmap VALUES(1980775, 'Super Macaroni', 1121, 5.0, 'https://osu.ppy.sh/beatmapsets/1980775/download', 11563671);
INSERT INTO Beatmap VALUES(1664805, 'Cosmic Cruise', 1532, 6.0, 'https://osu.ppy.sh/beatmapsets/1664805/download', 9821194);
INSERT INTO Beatmap VALUES(1980692, 'WereOni', 1452, 7.0, 'https://osu.ppy.sh/beatmapsets/1980692/download', 1910766);
INSERT INTO Beatmap VALUES(1939259, '[7K] Blazing Inferno', 6500, 8.0, 'https://osu.ppy.sh/beatmapsets/1939259/download', 7898495);
INSERT INTO Beatmap VALUES(1939327, '[7K] rickrollab', 8212, 8.0, 'https://osu.ppy.sh/beatmapsets/1939327/download', 18219603);
INSERT INTO Beatmap VALUES(1939270, '[7K] Event Horizon', 3200, 8.0, 'https://osu.ppy.sh/beatmapsets/1939270/download', 3360737);
INSERT INTO Beatmap VALUES(1657994, '[7K] Love You (Cut Ver.)', 5933, 7.0, 'https://osu.ppy.sh/beatmapsets/1657994/download', 2218047);
INSERT INTO Beatmap VALUES(1939330, '[7K] Schadenfreude', 8145, 8.0, 'https://osu.ppy.sh/beatmapsets/1939330/download', 18219603);


INSERT INTO Standard VALUES(2095159, 'TEMPORAL BLAST', 3.8);
INSERT INTO Standard VALUES(2095138, 'Annihilation', 4.2);
INSERT INTO Standard VALUES(2095121, 'Extra Stage', 4.0);
INSERT INTO Standard VALUES(2095134, 'Consumed', 4.0);
INSERT INTO Standard VALUES(2095157, 'Extra Stage', 4.0);

INSERT INTO Taiko VALUES(1980705, 'Hell Oni', 10.0);
INSERT INTO Taiko VALUES(1720005, 'X', 9.6);
INSERT INTO Taiko VALUES(1980775, 'Super Macaroni', 5.0);
INSERT INTO Taiko VALUES(1664805, 'Cosmic Cruise', 8.0);
INSERT INTO Taiko VALUES(1980692, 'WereOni', 10.0);

INSERT INTO Mania VALUES(1939259, '[7K] Blazing Inferno', 7);
INSERT INTO Mania VALUES(1939327, '[7K] rickrollab', 7);
INSERT INTO Mania VALUES(1939270, '[7K] Event Horizon', 7);
INSERT INTO Mania VALUES(1657994, '[7K] Love You (Cut Ver.)', 7);
INSERT INTO Mania VALUES(1939330, '[7K] Schadenfreude', 7);

INSERT INTO Score VALUES(1, 'HR', 760905, 1518, 96.48, '2023-12-01', 7813296, 2095159, 'TEMPORAL BLAST', 111534249);
INSERT INTO Score VALUES(2, 'HD', 599548, 1145, 96.39, '2023-12-01', 7075211, 2095138, 'Annihilation', 111534249);
INSERT INTO Score VALUES(3, NULL, 485149, 682, 98.13, '2023-12-01', 4108547, 2095121, 'Extra Stage', 111534249);
INSERT INTO Score VALUES(4, 'HD', 680844, 1163, 98.74, '2023-12-01', 7562902, 2095134, 'Consumed', 111534249);
INSERT INTO Score VALUES(5, NULL, 532323, 1186, 95.78, '2023-12-01', 7341183, 2095157, 'Extra Stage', 111534249);
INSERT INTO Score VALUES(6, NULL, 468524, 620, 96.33, '2023-12-01', 7813296, 2095138, 'Annihilation', 111534249);
INSERT INTO Score VALUES(7, 'HR', 556454, 687, 98.79, '2023-12-01', 7813296, 2095121, 'Extra Stage', 111534249);
INSERT INTO Score VALUES(8, 'HR', 558443, 1048, 94.15, '2023-12-01', 7813296, 2095134, 'Consumed', 111534249);
INSERT INTO Score VALUES(9, 'HR', 714260, 1172, 98.76, '2023-12-01', 7813296, 2095157, 'Extra Stage', 111534249);
