-- ============================================================
-- ONCHAIN CA$H - Dedicated PegKeeper Pools Query (scheduled)
-- Dune Query ID: 7767958
-- ============================================================
-- Local reference for the saved Dune SQL.
--
-- IMPORTANT rollout rule:
-- - This Dune query may support multiple validated rows (currently crvUSD,
--   msUSD, and alUSD), but application rollout remains one pool at a time.
-- - The dashboard only applies Dune data when poolRegistry.ts contains the
--   matching curvePoolAddress. Dune matching is address-only.
-- - At the time this reference was updated, code rollout includes crvUSD and
--   msUSD only. Do NOT add alUSD to poolRegistry.ts until its own PR.
--
-- SQL notes:
-- - from/to are reserved SQL keywords, so dex.trades references must use
--   t."from" and t."to".
-- - from_hex() is used for address comparisons because Dune stores addresses
--   as varbinary in these tables.
-- ============================================================

WITH
pool_list AS (
    SELECT *
    FROM (
        VALUES
            (from_hex('13e12bb0e6a2f1a3d6901a59a9d585e89a6243e1'), 'crvUSD/frxUSD', 'crvUSD'),
            (from_hex('9a9e2e70919c75d80aaaa1d483c46cdbb8ac4d1b'), 'frxUSD/msUSD', 'msUSD'),
            (from_hex('17f9682c9cd1a448b31c0428f1d0783ed13a9fa3'), 'alUSD/frxUSD', 'alUSD')
    ) AS p(pool_address, pool_name_hint, stablecoin_hint)
),

frxusd_token AS (
    SELECT from_hex('cacd6fd266af91b8aed52accc382b4e165586e29') AS token_address
),

-- Latest balance per (pool, token) combination.
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

pool_tvl AS (
    SELECT
        pool,
        SUM(balance_usd) AS total_tvl
    FROM current_balances
    GROUP BY pool
),

frxusd_in_pool AS (
    SELECT
        pool,
        SUM(balance_usd) AS frxusd_balance
    FROM current_balances
    WHERE token = (SELECT token_address FROM frxusd_token)
    GROUP BY pool
),

-- 24h Curve volume touching each pool address.
-- t."from" / t."to" must stay quoted because from/to are reserved words.
volume_24h AS (
    SELECT
        pl.pool_address,
        SUM(t.amount_usd) AS volume_24h
    FROM pool_list pl
    LEFT JOIN dex.trades t
        ON t.blockchain = 'ethereum'
       AND t.project = 'curve'
       AND t.block_time >= NOW() - INTERVAL '24' HOUR
       AND (
            t."from" = pl.pool_address
            OR t."to" = pl.pool_address
            OR t.project_contract_address = pl.pool_address
       )
    GROUP BY pl.pool_address
),

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
    COALESCE(pi.pool_name, pl.pool_name_hint, 'Unknown') AS pool_name,
    pl.stablecoin_hint AS stablecoin,
    COALESCE(pt.total_tvl, 0) AS total_tvl,
    COALESCE(fip.frxusd_balance, 0) AS frxusd_balance,
    COALESCE(v.volume_24h, 0) AS volume_24h,
    to_iso8601(NOW()) AS last_updated

FROM pool_list pl
LEFT JOIN pool_tvl pt        ON pt.pool = pl.pool_address
LEFT JOIN frxusd_in_pool fip ON fip.pool = pl.pool_address
LEFT JOIN volume_24h v       ON v.pool_address = pl.pool_address
LEFT JOIN pool_info pi       ON pi.pool_address = pl.pool_address

ORDER BY total_tvl DESC;
