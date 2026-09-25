export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || 'dev';
/** When this build was made (ms since epoch); shown to people as "Updated <date>". */
export const BUILD_TIME = Number(process.env.NEXT_PUBLIC_BUILD_TIME) || 0;
