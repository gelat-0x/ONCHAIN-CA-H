-- ==========================================================
-- ONCHAIN CA$H - frxUSD PegKeeper Pools
-- Dune reference query using stablecoins_evm.transfers
-------------------------------------------------------

-- Dune query supports multiple validated rows.
-- App registry rollout remains one pool per PR.
------------------------------------------------

-- Current app rollout:
--   - crvUSD/frxUSD
--   - frxUSD/msUSD
-------------------

-- alUSD/frxUSD is included here as a Dune-supported row only.
-- Do NOT add alUSD to poolRegistry.ts until it has its own
-- validated Dune sample row and separate PR.
-- ==========================================================

WITH
constants AS (
SELECT *
FROM (
VALUES
(
0x13e12BB0E6A2f1A3d6901a59a9d585e89A6243e1,
'crvUSD/frxUSD',
'crvUSD',
0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E,
0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29
),
(
0x9A9e2e70919c75D80aAaA1D483c46CdBb8ac4d1b,
'frxUSD/msUSD',
'msUSD',
0xab5eb14c09d416f0ac63661e57edb7aecdb9befa,
0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29
),
(
0x17F9682c9cd1a448b31C0428F1D0783eD13a9Fa3,
'alUSD/frxUSD',
'alUSD',
0xBC6DA0FE9aD5f3b0d58160288917AA56653660E9,
0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29
)
) AS t (
pool_address,
pool_name,
stablecoin,
stablecoin_token,
frxusd_token
)
),

token_flows AS (
SELECT
c.pool_address,
c.pool_name,
c.stablecoin,
t.token_address,
t.token_symbol,

    CASE
        WHEN t."to" = c.pool_address THEN t.amount
        WHEN t."from" = c.pool_address THEN -t.amount
        ELSE 0
    END AS signed_amount,

    t.amount,
    t.block_time

FROM stablecoins_evm.transfers t
JOIN constants c
    ON t.blockchain = 'ethereum'
    AND t.token_address IN (c.frxusd_token, c.stablecoin_token)
    AND (
        t."to" = c.pool_address
        OR t."from" = c.pool_address
    )

),

balances AS (
SELECT
pool_address,
pool_name,
stablecoin,
token_address,
token_symbol,
SUM(signed_amount) AS balance
FROM token_flows
GROUP BY
pool_address,
pool_name,
stablecoin,
token_address,
token_symbol
),

pool_summary AS (
SELECT
c.pool_address,
c.pool_name,
c.stablecoin,

    COALESCE(
        SUM(
            CASE
                WHEN b.token_address IN (c.frxusd_token, c.stablecoin_token)
                THEN b.balance
                ELSE 0
            END
        ),
        0
    ) AS total_tvl,

    COALESCE(
        SUM(
            CASE
                WHEN b.token_address = c.frxusd_token
                THEN b.balance
                ELSE 0
            END
        ),
        0
    ) AS frxusd_balance

FROM constants c
LEFT JOIN balances b
    ON b.pool_address = c.pool_address
GROUP BY
    c.pool_address,
    c.pool_name,
    c.stablecoin

),

volume_24h AS (
SELECT
c.pool_address,
SUM(t.amount) / 2 AS volume_24h
FROM stablecoins_evm.transfers t
JOIN constants c
ON t.blockchain = 'ethereum'
AND t.token_address IN (c.frxusd_token, c.stablecoin_token)
AND (
t."to" = c.pool_address
OR t."from" = c.pool_address
)
WHERE t.block_time >= NOW() - INTERVAL '24' HOUR
GROUP BY
c.pool_address
)

SELECT
s.pool_address,
s.pool_name,
s.stablecoin,
s.total_tvl,
s.frxusd_balance,
COALESCE(v.volume_24h, 0) AS volume_24h,
to_iso8601(NOW()) AS last_updated
FROM pool_summary s
LEFT JOIN volume_24h v
ON v.pool_address = s.pool_address
ORDER BY
s.total_tvl DESC
