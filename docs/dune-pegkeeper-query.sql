-- ==========================================================
-- ONCHAIN CA$H - frxUSD PegKeeper Pools
-- Dune query for net frxUSD balance in PegKeeper Curve pools
-- ==========================================================
--
-- This query calculates the current net frxUSD held in each PegKeeper's
-- Curve pool contract by replaying all historical transfers.
--
-- KEY FIXES (2026 update):
-- 1. Switched from stablecoins_evm.transfers to tokens_ethereum.transfers
--    Reason: stablecoins_evm.transfers is a curated view that only includes
--    a limited set of "stablecoins". It was missing or incomplete for frxUSD
--    transfers (and many newer partner stables like USPC, srRoyUSDC, tmvUSDC,
--    AZND, muBOND, YUSD, etc.). This caused frxusd_balance = 0 even when
--    Curve UI showed large frxUSD holdings.
--    tokens_ethereum.transfers is the general, complete ERC20 transfer table
--    and reliably captures every transfer of the exact frxusd_token and
--    stablecoin_token.
--
-- 2. Verified and corrected ALL stablecoin_token addresses in the constants
--    CTE by querying the official Curve API (/v1/getPools/all/ethereum) and
--    extracting the non-frxUSD coin for each pool_address.
--    This ensures future expansions and correct matching.
--
-- 3. Expanded constants to include every pool that has a curvePoolAddress
--    in poolRegistry.ts (one source of truth for which pools are active
--    PegKeepers).
--
-- The frxusd_balance is purely the net balance of the frxUSD token in the
-- pool contract (independent of the stable side). The stablecoin_token is
-- still included for potential future total_tvl accuracy and debugging.
--
-- signed_amount logic: +amount when transferred TO the pool, -amount when
-- transferred FROM the pool. This gives the current on-chain balance.
--
-- ==========================================================

WITH
constants AS (
SELECT *
FROM (
VALUES
-- Original / high-confidence pools (tokens verified against Curve API)
(0x13e12BB0E6A2f1A3d6901a59a9d585e89A6243e1, 'crvUSD/frxUSD', 'crvUSD', 0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E, 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29),
(0x9A9e2e70919c75D80aAaA1D483c46CdBb8ac4d1b, 'frxUSD/msUSD', 'msUSD', 0xab5eb14c09d416f0ac63661e57edb7aecdb9befa, 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29),
(0x17F9682c9cd1a448b31C0428F1D0783eD13a9Fa3, 'alUSD/frxUSD', 'alUSD', 0xBC6DA0FE9aD5f3b0d58160288917AA56653660E9, 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29),

-- Batch expansions (tokens verified via Curve API for the exact pool)
(0xBf5047039F2980C21eB5692c790BAd8A9533b900, 'frxUSD/pmUSD', 'pmUSD', 0xC0c17dD08263C16f6b64E772fB9B723Bf1344DdF, 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29),
(0x552827613fEA5EaDa3871f83b2d407d50CB04116, 'frxUSD/evaUSDT', 'evaUSDT', 0x501eBf66d76A96D4FB26ccead42957653e16B8B8, 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29),
(0x68d03Ed49800e92D7Aa8aB171424007e55Fd1F49, 'frxUSD/OUSD', 'OUSD', 0x2A8e1E676Ec238d8A992307B495b45B3fEAa5e86, 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29),
(0x96BCA2cea58A8e08E7da5C9D68b8aCBb28419d1d, 'frxUSD/USPC', 'USPC', 0xbF4e3fbE8B60062A00C7a6B1D97d0d49c2971A19, 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29),
(0xd50492DE3541d75E61eDC34D1Aa79C7dC2d20da9, 'frxUSD/USP', 'USP', 0x098697bA3Fee4eA76294C5d6A466a4e3b3E95FE6, 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29),
(0xf76329c6dc10FdfbEe6CA520d0BF4d474E95E46E, 'frxUSD/avUSD', 'avUSD', 0xf4c13D631450De6B12a19829E37c8e2826891dC4, 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29),
(0xEfc056790bb19702b2164ec6Ea6bA3AE01d81195, 'frxUSD/USG', 'USG', 0xB1c2Db5d6cA03FCe73dBd304d320bF76C55Ae1B1, 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29),
(0x6dD7522c83ecd5d67F8eaF11A973219C6A9f7493, 'frxUSD/tmvUSDC', 'tmvUSDC', 0x697c54a84D83F37380d034e2BfC6F7cE8d89F4Ee, 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29),
(0x310a9Fd2906c6a3eE97289095b183f96309c56AE, 'frxUSD/srRoyUSDC', 'srRoyUSDC', 0xcD9f5907F92818bC06c9Ad70217f089E190d2a32, 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29),
(0xcAF1969E9ba98C05113b75d8633A17196e2D02a5, 'frxUSD/sUSDat', 'sUSDat', 0xD166337499E176bbC38a1FBd113Ab144e5bd2Df7, 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29),
(0x851907CAC684797eee43669798D78004e269Cb5E, 'fxUSD/frxUSD', 'fxUSD', 0x085780639CC2cACd35E474e71f4d000e2405d8f6, 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29),
(0x01646F6fe0d75CEd6E514faB0Ea2F4ed5e1A5C9F, 'frxUSD/muBOND', 'muBOND', 0x09AD9c6DcadCc3aB0b3E107E8E7DA69c2eEa8599, 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29),
(0x9D8AFD5Ce19A3b948049468188f1De13951A4383, 'frxUSD/sDOLA', 'sDOLA', 0xb45ad160634c528Cc3D2926d9807104FA3157305, 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29),
(0x917213760aF19E938E1C5cf4c6c3a963f6F32152, 'frxUSD/savUSD', 'savUSD', 0xb8D89678E75a973E74698c976716308abB8a46A4, 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29),
(0x3e823bd1015Ba1A12F2F8aFD631c822a1CBA0de7, 'frxUSD/iUSD', 'iUSD', 0x48f9e38f3070AD8945DFEae3FA70987722E3D89c, 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29),
(0x31d563e7d382CD934014BeC8C6C931751E6b3a9a, 'frxUSD/ebUSD', 'ebUSD', 0x09fD37d9AA613789c517e76DF1c53aEce2b60Df4, 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29),
(0x20d4c49a873EaeFf76EfBD0cF19002F6E19EF52c, 'frxUSD/USDaf', 'USDaf', 0x9Cf12ccd6020b6888e4D4C4e4c7AcA33c1eB91f8, 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29),
(0x16a973F8e466F44e9eA67e7e2d3166bD460ea852, 'frxUSD/AZND', 'AZND', 0x52c66B5E7f8Fde20843De900C5C8B4b0F23708A0, 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29),
(0x2Cc565dDe7C078A8E477763a34C40e52b13e6396, 'frxUSD/YUSD', 'YUSD', 0x4274cD7277C7bb0806Bd5FE84b9aDAE466a8DA0a, 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29),
(0x5e9ce43c5b1e2872755977e0a57eac44c0c0f951, 'frxUSD/dUSD', 'dUSD', 0x7CB20517776636eD76b68EdB3D99DCce356ABf02, 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29)

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
    t.contract_address AS token_address,
    t.token_symbol,

    CASE
        WHEN t."to" = c.pool_address THEN t.amount
        WHEN t."from" = c.pool_address THEN -t.amount
        ELSE 0
    END AS signed_amount,

    t.amount,
    t.block_time

FROM tokens_ethereum.transfers t
JOIN constants c
    ON t.blockchain = 'ethereum'
    AND t.contract_address IN (c.frxusd_token, c.stablecoin_token)
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
FROM tokens_ethereum.transfers t
JOIN constants c
    ON t.blockchain = 'ethereum'
    AND t.contract_address IN (c.frxusd_token, c.stablecoin_token)
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
