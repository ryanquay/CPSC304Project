export interface Artist {
	artistId: number;
	isFeatured: boolean;
	name: string;
}

export interface Song {
	songId: number;
	bpm: number;
	genre: string;
	name: string;
	artistId: number;
}

export interface BeatmapSet {
	beatmapSetId: number;
	creationDate: string;
	mapperId: number;
	songId: number;
}

// COUPLED: with BeatmapSetPOSTRequestBody
export interface Beatmap {
	beatmapSetId: number;
	difficultyName: string;
	maxCombo: number;
	hpDrain: number;
	hitObjectsUrl: string;
	mapperId: number;
}

export interface BeatmapHitObjects {
	hitObjectsUrl: string;
	maxCombo: number;
	hpDrain: number;
	stars: number;
}

export interface Player {
	playerId: number;
	rank: number;
	username: string;
	joinDate: string;
	countryName: string;
}

export interface Standard {
	beatmapSetId: number;
	difficultyName: string;
	circleSize: number;
}

export interface Taiko {
	beatmapSetId: number;
	difficultyName: string;
	drumSpeed: number;
}

export interface Mania {
	beatmapSetId: number;
	difficultyName: string;
	keyCount: number;
}

export interface Score {
	scoreId: number;
	modifier?: string;
	totalScore: number;
	accuracy: number;
	dateSet: string;
	playerId: number;
	beatmapSetId: number;
	difficultyName: string;
	matchId: number;
}

export interface Match {
	matchId: number;
	round: string;
	tournamentId: number;
}

export interface Tournament {
	tournamentId: number;
	name: string;
	lowerRankBound?: number;
	upperRankBound?: number;
	startDate: string;
	badgeUrl?: string;
	countryName?: string;
}

export interface TournamentBadge {
	badgeUrl: string;
	badgeIssueDate: string;
}

export interface Country {
	countryName: string;
	flag: any; // TODO: flag BLOBs
}

export interface ResponseJSON {
	success: true;
	data?: any[];
	rowsAffected?: number; // does not include rows affected by ON DELETE CASCADE
}

export interface ErrorJSON {
	success: false;
	name: string;
	message: string;
}

export interface BeatmapSetExtended extends BeatmapSet {
	mapperUsername: string;
	songBpm: number;
	songGenre: string;
	songName: string;
	artistName: string;
}

export interface BeatmapSetPUTRequestBodyManual {
	beatmapSet: BeatmapSet;
	mapper: Omit<Player, "playerId">;
	mapperCountry: Omit<Country, "countryName">;
	song: Omit<Song, "songId">;
	songArtist: Omit<Artist, "artistId">;
}

export interface BeatmapSetPUTRequestBodyAuto {
	beatmapSetId: number
}

// COUPLED: with BeatmapSet
export interface BeatmapSetPOSTRequestBody {
	creationDate: string | null;
	mapperId: number | null;
	songId: number | null;
}

export interface MatchPUTRequestBody {
	matchId: number;
	tournamentId: number;
	numWarmups: number;
}

export interface SongPUTRequestBody extends Omit<Song, "songId" | "artistId"> {
	artistName: string
	artistIsFeatured: boolean
}

export interface PlayerAvgAccuracy extends Pick<Player, "playerId" | "username">, Pick<Score, "accuracy"> {}

export interface PlayerAvgScore extends Pick<Player, "playerId" | "username">, Pick<Score, "totalScore"> {}

// oauth2 ref: https://www.oauth.com/oauth2-servers/access-tokens/access-token-response/
export type OAuthToken = {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope?: string;
}

export type OsuRequestHeader = {
    Accept: string;
    'Content-Type': string;
    Authorization: string;
}
