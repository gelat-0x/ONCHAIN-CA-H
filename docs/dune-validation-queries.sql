-- ============================================================
-- VALIDATION QUERIES for ONCHAIN CA$H PegKeeper Dune Query
-- Run these first to validate the data model before building the full query.
-- ============================================================

-- ============================================================
-- 1. Validate pool_balances table structure and latest data
--    Replace with a real Curve pool address that contains frxUSD
-- ============================================================
WITH latest AS (
    SELECT 
        pool,
        token,
        token_symbol,
        balance,
        balance_usd,
        block_time,
        ROW_NUMBER() OVER (PARTITION BY pool, token ORDER BY block_time DESC) as rn
    FROM curvefi_ethereum.pool_balances
    WHERE pool = from_hex('0xPUT_ONE_REAL_POOL_ADDRESS_HERE')   -- e.g. a known frxUSD pool
      AND block_time >= NOW() - INTERVAL '3' DAY
)
SELECT 
    to_hex(pool) as pool,
    to_hex(token) as token,
    token_symbol,
    balance,
    balance_usd,
    block_time
FROM latest
WHERE rn = 1
ORDER BY balance_usd DESC
LIMIT 20;


-- ============================================================
-- 2. Validate we can get frxUSD balance for a specific pool
--    Use the real frxUSD token address
-- ============================================================
WITH latest AS (
    SELECT 
        pool,
        token,
        balance_usd,
        block_time,
        ROW_NUMBER() OVER (PARTITION BY pool, token ORDER BY block_time DESC) as rn
    FROM curvefi_ethereum.pool_balances
    WHERE pool = from_hex('0xPUT_ONE_REAL_POOL_ADDRESS_HERE')
      AND block_time >= NOW() - INTERVAL '3' DAY
)
SELECT 
    to_hex(pool) as pool,
    SUM(CASE WHEN token = from_hex('0xPUT_FRXUSD_TOKEN_ADDRESS_HERE') THEN balance_usd ELSE 0 END) as frxusd_balance_usd,
    SUM(balance_usd) as total_tvl_usd,
    MAX(block_time) as last_updated
FROM latest
WHERE rn = 1
GROUP BY pool;


-- ============================================================
-- 3. Validate 24h volume for the same pool
-- ============================================================
SELECT 
    pool_address,
    SUM(amount_usd) as volume_24h_usd,
    COUNT(*) as trade_count
FROM dex.trades
WHERE blockchain = 'ethereum'
  AND project = 'curve'
  AND block_time >= NOW() - INTERVAL '24' HOUR
  AND pool_address = '0xPUT_ONE_REAL_POOL_ADDRESS_HERE'   -- note: sometimes stored as string, sometimes varbinary
GROUP BY pool_address;
