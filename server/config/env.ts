/** Environment variable names — set values in .env (see .env.example) */
export const ENV = {
  PORT: 'PORT',
  NODE_ENV: 'NODE_ENV',
  DUNE_API_KEY: 'DUNE_API_KEY',
  COINGECKO_API_KEY: 'COINGECKO_API_KEY',
} as const;

export function envPort(defaultPort = 3001): number {
  const p = process.env[ENV.PORT];
  return p ? Number(p) : defaultPort;
}

export function envOptional(key: string): string | undefined {
  return process.env[key] || undefined;
}
