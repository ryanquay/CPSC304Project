import { closePoolAndExit, initializeConnectionPool, recreateTables } from "./appService";

// run re-initialization script (using an IIFE)
(async () => {
    try {
        await initializeConnectionPool();
        process.once('SIGTERM', closePoolAndExit).once('SIGINT', closePoolAndExit);
        await recreateTables();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
