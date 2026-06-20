-- ============================================================
-- ONCHAIN CA$H - Dedicated PegKeeper Pools Query (Explicit v2)
-- ============================================================
-- Corrected based on feedback:
-- - Proper partitioning by (pool, token) for latest balances
-- - from_hex() for address comparisons (Dune often stores addresses as varbinary)
-- - split('{{...}}', ',') syntax for parameters
-- ============================================================

WITH 
pool_list AS (
    SELECT 
        from_hex(TRIM(addr)) AS pool_address
    FROM UNNEST(SPLIT('{{pool_addresses}}', ',')) AS t(addr)
    WHERE TRIM(addr) <> ''
),

frxusd_token AS (
    SELECT from_hex('{{frxusd_token}}') AS token_address
),

-- Get the latest balance per (pool, token) combination
latest_balances AS (
    SELECT 
        pb.pool,
        pb.token,
        pb.token_symbol,
        pb.balance,
        pb.balance_usd,
        pb.block_time,
        ROW_NUMBER() OVER (
            PARTITION BY pb.pool, pb.token 
            ORDER BY pb.block_time DESC
        ) AS rn
    FROM curvefi_ethereum.pool_balances pb
    WHERE pb.pool IN (SELECT pool_address FROM pool_list)
      AND pb.block_time >= NOW() - INTERVAL '2' DAY
),

current_balances AS (
    SELECT *
    FROM latest_balances
    WHERE rn = 1
),

-- Total TVL per pool
pool_tvl AS (
    SELECT 
        pool,
        SUM(balance_usd) AS total_tvl
    FROM current_balances
    GROUP BY pool
),

-- frxUSD specific balance
frxusd_in_pool AS (
    SELECT 
        pool,
        SUM(balance_usd) AS frxusd_balance
    FROM current_balances
    WHERE token = (SELECT token_address FROM frxusd_token)
    GROUP BY pool
),

-- 24h volume
volume_24h AS (
    SELECT 
        from_hex(pool_address) AS pool_address,
        SUM(amount_usd) AS volume_24h
    FROM dex.trades
    WHERE blockchain = 'ethereum'
      AND project = 'curve'
      AND block_time >= NOW() - INTERVAL '24' HOUR
      AND from_hex(pool_address) IN (SELECT pool_address FROM pool_list)
    GROUP BY pool_address
),

-- Pool metadata
pool_info AS (
    SELECT 
        pool_address,
        pool_name,
        symbol
    FROM curvefi_ethereum.view_pools
    WHERE pool_address IN (SELECT pool_address FROM pool_list)
)

SELECT 
    to_hex(pl.pool_address) AS pool_address,
    COALESCE(pi.pool_name, 'Unknown') AS pool_name,
    
    CASE 
        WHEN pi.symbol LIKE '%/%' THEN TRIM(SPLIT_PART(pi.symbol, '/', 2))
        ELSE 'Unknown'
    END AS stablecoin,
    
    COALESCE(pt.total_tvl, 0) AS total_tvl,
    COALESCE(fip.frxusd_balance, 0) AS frxusd_balance,
    COALESCE(v.volume_24h, 0) AS volume_24h,
    to_iso8601(NOW()) AS last_updated  -- ISO format for reliable Node.js Date parsing (4h staleness check)

FROM pool_list pl
LEFT JOIN pool_tvl pt         ON pt.pool = pl.pool_address
LEFT JOIN frxusd_in_pool fip  ON fip.pool = pl.pool_address
LEFT JOIN volume_24h v        ON v.pool_address = pl.pool_address
LEFT JOIN pool_info pi        ON pi.pool_address = pl.pool_address

ORDER BY total_tvl DESC;
