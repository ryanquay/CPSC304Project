import * as dotenv from 'dotenv';

dotenv.config();
/**
 * Wrapper class for local configuration settings.
 */
export default class Config {
    public static readonly ORACLE_USER: string = process.env['ORACLE_USER'] as string;
    public static readonly ORACLE_PASS: string = process.env['ORACLE_PASS'] as string;
    public static readonly PORT: number = Number(process.env['PORT']);

    public static readonly ORACLE_HOST: string = process.env['ORACLE_HOST'] as string;
    public static readonly ORACLE_PORT: number = Number(process.env['ORACLE_PORT']);
    public static readonly ORACLE_DBNAME: string = process.env['ORACLE_DBNAME'] as string;

    public static readonly OSU_API_CLIENT_ID: number = Number(process.env['OSU_API_CLIENT_ID']);
    public static readonly OSU_API_CLIENT_SECRET: string = process.env['OSU_API_CLIENT_SECRET'] as string;

    // config for oracledb connection pools
    public static readonly DB_CONFIG = {
        user: Config.ORACLE_USER,
        password: Config.ORACLE_PASS,
        connectString: `${Config.ORACLE_HOST}:${Config.ORACLE_PORT}/${Config.ORACLE_DBNAME}`,
        poolMin: 1,
        poolMax: 3,
        poolIncrement: 1,
        poolTimeout: 60
    };
}
