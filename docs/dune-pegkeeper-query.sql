-- ============================================================
-- ONCHAIN CA$H - PegKeeper Dune query reference
-- Dune Query ID: 7767958
-- ============================================================
-- This file mirrors the saved Dune query structure used by the backend.
--
-- Rollout rules:
-- - The Dune query can support multiple validated rows.
-- - App registry rollout remains one pool per PR.
-- - Current app rollout is crvUSD + msUSD only.
-- - alUSD is included only in this Dune reference query and must NOT be
--   added to shared/data/poolRegistry.ts until a separate validation + PR.
--
-- SQL notes:
-- - The query uses stablecoins_evm.transfers.
-- - from/to are SQL reserved words, so transfer fields must be quoted as
--   t."from" and t."to".
-- - Pool matching in the app remains address-only via curvePoolAddress.
-- ============================================================

WITH
constants AS (
    SELECT
        from_hex('cacd6fd266af91b8aed52accc382b4e165586e29') AS frxusd_token
),

pool_list AS (
    SELECT *
    FROM (
        VALUES
            (
                from_hex('13e12bb0e6a2f1a3d6901a59a9d585e89a6243e1'),
                'crvUSD/frxUSD',
                'crvUSD'
            ),
            (
                from_hex('9a9e2e70919c75d80aaaa1d483c46cdbb8ac4d1b'),
                'frxUSD/msUSD',
                'msUSD'
            ),
            (
                from_hex('17f9682c9cd1a448b31c0428f1d0783ed13a9fa3'),
                'alUSD/frxUSD',
                'alUSD'
            )
    ) AS p(pool_address, pool_name, stablecoin)
),

transfer_deltas AS (
    SELECT
        pl.pool_address,
        pl.pool_name,
        pl.stablecoin,
        t.contract_address AS token_address,
        t.symbol AS token_symbol,
        t.amount AS token_delta,
        t.amount_usd AS usd_delta,
        t.evt_block_time AS block_time
    FROM stablecoins_evm.transfers t
    INNER JOIN pool_list pl
        ON t."to" = pl.pool_address
    WHERE t.blockchain = 'ethereum'

    UNION ALL

    SELECT
        pl.pool_address,
        pl.pool_name,
        pl.stablecoin,
        t.contract_address AS token_address,
        t.symbol AS token_symbol,
        -t.amount AS token_delta,
        -t.amount_usd AS usd_delta,
        t.evt_block_time AS block_time
    FROM stablecoins_evm.transfers t
    INNER JOIN pool_list pl
        ON t."from" = pl.pool_address
    WHERE t.blockchain = 'ethereum'
),

current_balances AS (
    SELECT
        pool_address,
        pool_name,
        stablecoin,
        token_address,
        token_symbol,
        SUM(token_delta) AS token_balance,
        SUM(usd_delta) AS balance_usd,
        MAX(block_time) AS last_transfer_time
    FROM transfer_deltas
    GROUP BY 1, 2, 3, 4, 5
    HAVING ABS(SUM(token_delta)) > 0.000001
),

pool_totals AS (
    SELECT
        pool_address,
        pool_name,
        stablecoin,
        SUM(CASE WHEN balance_usd > 0 THEN balance_usd ELSE 0 END) AS total_tvl,
        MAX(last_transfer_time) AS last_transfer_time
    FROM current_balances
    GROUP BY 1, 2, 3
),

frxusd_balances AS (
    SELECT
        cb.pool_address,
        SUM(CASE WHEN cb.balance_usd > 0 THEN cb.balance_usd ELSE 0 END) AS frxusd_balance
    FROM current_balances cb
    CROSS JOIN constants c
    WHERE cb.token_address = c.frxusd_token
    GROUP BY 1
),

volume_24h AS (
    SELECT
        pl.pool_address,
        SUM(ABS(t.amount_usd)) AS volume_24h
    FROM stablecoins_evm.transfers t
    INNER JOIN pool_list pl
        ON t."from" = pl.pool_address
        OR t."to" = pl.pool_address
    WHERE t.blockchain = 'ethereum'
      AND t.evt_block_time >= NOW() - INTERVAL '24' HOUR
    GROUP BY 1
)

SELECT
    to_hex(pl.pool_address) AS pool_address,
    pl.pool_name,
    pl.stablecoin,
    COALESCE(pt.total_tvl, 0) AS total_tvl,
    COALESCE(fb.frxusd_balance, 0) AS frxusd_balance,
    COALESCE(v.volume_24h, 0) AS volume_24h,
    to_iso8601(COALESCE(pt.last_transfer_time, NOW())) AS last_updated
FROM pool_list pl
LEFT JOIN pool_totals pt
    ON pt.pool_address = pl.pool_address
LEFT JOIN frxusd_balances fb
    ON fb.pool_address = pl.pool_address
LEFT JOIN volume_24h v
    ON v.pool_address = pl.pool_address
ORDER BY total_tvl DESC;
