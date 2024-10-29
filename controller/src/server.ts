import express from 'express';
import cors from 'cors';
import Config from './util/config';
import appRouter from './appRouter';
import { closePoolAndExit, initializeConnectionPool } from './appService';
import OsuWrapper from './osuWrapper';

// initialize connection pool and osuwrapper (using an IIFE)
export let osu: OsuWrapper | null = null;
(async () => {
    try {
        await initializeConnectionPool();
        process.once('SIGTERM', closePoolAndExit).once('SIGINT', closePoolAndExit);
        osu = await OsuWrapper.build();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
const app = express();

// middleware setup
// app.use(express.static('public')); // serve static files from the 'public' directory
app.use(express.json());           // parse incoming JSON payloads
app.use(cors());


// mount the router
app.use('/', appRouter);

// start the server
app.listen(Config.PORT, () => {
    console.log(`Server running on http://localhost:${Config.PORT}`);
});
