import { OAuthToken, OsuRequestHeader } from "@shared/types";
import Config from "./util/config";
import { sleep } from "./util/util";
import fetch from 'node-fetch';

// client wrapper for osu!api
// repurposed from https://github.com/mbalsdon/mor4/blob/main/src/OsuWrapper.ts
//      (^^^ this belongs to one of our group members)
export default class OsuWrapper {
    private static TOKEN_URL = new URL('https://osu.ppy.sh/oauth/token');
    private static API_URL = new URL('https://osu.ppy.sh/api/v2');
    private static TOKEN_REQUEST: fetch.RequestInit = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            client_id: Config.OSU_API_CLIENT_ID,
            client_secret: Config.OSU_API_CLIENT_SECRET,
            grant_type: 'client_credentials',
            scope: 'public'
        })
    };

    private _accessToken: string;
    private _accessTokenDuration: number;
    private _accessTokenAcquiryTime: number;

    // --------------------------------------------------------------------------------------------------------------
    // --------- public ---------------------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------------------------------------

    // retrieve osu!api oauth token and construct osuwrapper
    public static async build(): Promise<OsuWrapper> {
        console.debug('OsuWrapper::build - building OsuWrapper...');
        const token = await OsuWrapper.getAccessToken();
        if (token === undefined) {
            throw new Error('OsuWrapper::build - token is undefined!')
        }

        return new OsuWrapper(<OAuthToken>token);
    }

    // get user from key (key = 'id' | 'username')
    public async getUser(username: string, key: string): Promise<any> {
        console.debug(`OsuWrapper::getUser - retrieving user ${username}...`);
        const url = new URL(`${OsuWrapper.API_URL}/users/${username}/osu`);
        url.searchParams.append('key', key);
        const request: fetch.RequestInit = {
            method: 'GET',
            headers: this.buildHeaders()
        };
        await this.refreshToken();
        return OsuWrapper.makeRequest(url, request);
    }

    // get beatmapset from id
    public async getBeatmapSet(beatmapSetId: number): Promise<any> {
        console.debug(`OsuWrapper::getBeatmapSet - retrieving beatmapset with ID ${beatmapSetId}...`);
        const url = new URL(`${OsuWrapper.API_URL}/beatmapsets/${beatmapSetId}`);
        const request: fetch.RequestInit = {
            method: 'GET',
            headers: this.buildHeaders()
        };
        await this.refreshToken();
        return OsuWrapper.makeRequest(url, request);
    }

    // get match from id
    public async getMatch(matchId: number, before: number): Promise<any> {
        console.debug(`OsuWrapper::getMatch - retrieving match with ID ${matchId} with events before ${before}...`);
        const url = new URL(`${OsuWrapper.API_URL}/matches/${matchId}`);
        if (before != -1) {
            url.searchParams.append('before', `${before}`);
        }
        const request: fetch.RequestInit = {
            method: 'GET',
            headers: this.buildHeaders()
        };
        await this.refreshToken();
        return OsuWrapper.makeRequest(url, request);
    }

    // get all events from match
    public async getMatchEvents(matchId: number): Promise<any[]> {
        let match = await this.getMatch(matchId, -1);
        let events: any[] = match.events;
        while (match.events.length > 0) {
            match = await this.getMatch(matchId, match.events[0].id);
            events = events.concat(match.events);
        }
        return events;
    }

    // get beatmap
    public async getBeatmap(beatmapId: number): Promise<any> {
        console.debug(`OsuWrapper::getBeatmap - retrieving beatmap with ID ${beatmapId}...`);
        const url = new URL(`${OsuWrapper.API_URL}/beatmaps/${beatmapId}`);
        const request: fetch.RequestInit = {
            method: 'GET',
            headers: this.buildHeaders()
        };
        await this.refreshToken();
        return OsuWrapper.makeRequest(url, request);
    }

    // get beatmap difficulty attributes for NM
    // only works for mode=standard
    public async getBeatmapAttributes(beatmapId: number): Promise<any> {
        console.debug(`OsuWrapper::getBeatmapAttributes - retrieving attributes for beatmap with ID ${beatmapId}...`);
        const url = new URL(`${OsuWrapper.API_URL}/beatmaps/${beatmapId}/attributes`);
        const request: fetch.RequestInit = {
            method: 'POST',
            headers: this.buildHeaders(),
            body: JSON.stringify({
                mods: [],
                ruleset: 'osu'
            })
        };
        await this.refreshToken();
        return OsuWrapper.makeRequest(url, request);
    }

    // --------------------------------------------------------------------------------------------------------------
    // --------- private --------------------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------------------------------------

    // DON'T CALL DIRECTLY - use OsuWrapper.build() instead!
    // constructs the client
    private constructor(token: OAuthToken) {
        console.debug('OsuWrapper::constructor - constructing OsuWrapper instance...');
        this._accessToken = token.access_token;
        this._accessTokenDuration = token.expires_in;
        this._accessTokenAcquiryTime = Math.floor(new Date().getTime() / 1000);
    }

    // standard osu!api request headers
    private buildHeaders(): OsuRequestHeader {
        return {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this._accessToken}`
        };
    }

    // retrieve osu!api oauth token
    private static async getAccessToken(): Promise<OAuthToken> {
        console.debug('OsuWrapper::getAccessToken - retrieving access token...');
        const token = await OsuWrapper.makeRequest(OsuWrapper.TOKEN_URL, OsuWrapper.TOKEN_REQUEST);
        return token;
    }

    // check if token expired, update if so
    private async refreshToken (): Promise<void> {
        const currentTime = Math.floor(new Date().getTime() / 1000);
        if (currentTime > this._accessTokenAcquiryTime + this._accessTokenDuration) {
            console.log('OsuWrapper::refreshToken - token expired! Attempting to refresh...');
            const token = await OsuWrapper.makeRequest(OsuWrapper.TOKEN_URL, OsuWrapper.TOKEN_REQUEST);
            if (token === undefined) {
                throw new Error('OsuWrapper::refreshToken - token is undefined!');
            }
            this._accessToken = token.access_token;
            this._accessTokenDuration = token.expires_in;
            this._accessTokenAcquiryTime = currentTime;
        }
        return;
    }

    // make feetch request
    // return undefined if resource couldn't be found (404)
    // if req is ratelimited or server error occurs, wait according to exponential backoff
    // status code logic implemented according to https://github.com/ppy/osu-web/blob/master/resources/lang/en/layout.php
    private static async makeRequest(url: URL, request: fetch.RequestInit): Promise<any> {
        console.debug(`OsuWrapper::makeRequest - making request to ${url}...`);
        let delayMs = 100;
        let retries = 0;
        while (true) {
            await sleep(delayMs);
            const response = await fetch(url, request);
            const statusCode = response.status;
            console.debug(`OsuWrapper::makeRequest - received ${statusCode}: ${response.statusText}`);

            // OK - return response data
            if (statusCode === 200) {
                return response.json();
            // Not Found - return undefined
            } else if (statusCode === 404) {
                return undefined;
            // Too Many Requests / 5XX (Internal Server Error) - wait according to exponential backoff algorithm
            } else if ((statusCode === 429) || (statusCode.toString().startsWith('5'))) {
                if (delayMs >= 64000) {
                    delayMs = 64000 + Math.round(Math.random() * 1000);
                } else {
                    delayMs = (Math.pow(2, retries) + Math.random()) * 1000;
                }

                console.warn(`OsuWrapper::makeRequest - received ${statusCode} response; retrying in ${Math.round(delayMs / 10) / 100} seconds...`);
                ++retries;
            } else {
                throw new RangeError(`OsuWrapper::makeRequest - received an unhandled response code! ${statusCode}: ${response.statusText}`);
            }
        }
    }
}
