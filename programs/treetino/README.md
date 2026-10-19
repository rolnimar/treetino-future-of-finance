# Treetino Solana protocol

Hackathon MVP built with Anchor 1.2, Anchor SPL, Rust, and LiteSVM 0.17.
No validator is needed for the tests: they execute the compiled SBF program.

Each tree has its own PDA, six-decimal SPL share mint, funding vault, revenue
vault, and investor reward positions. The program ID is
`EEbZ5DVTQ9f4XeRwmSh4u2QPiMSSmQjqKPNEpDHoBU2n`.

## Lifecycle

1. `init_admins(admins)`: the current program upgrade authority initializes
   the global list of 1 to 10 admins. This is required before creating trees.
2. `init_payment_token`: initialize the single six-decimal classic SPL payment
   mint at the PDA derived from `[b"payment_mint"]`. This is USDC, a 1:1 USD-pegged
   clean energy stablecoin (1 USDC = 1 EUR, 6 decimals). It has name/symbol metadata (`USDC`),
   program-controlled mint authority, and no freeze authority.
   Initialization can succeed only once per program ID on each cluster.
3. `init_tree`: a listed admin signs as creator and chooses tree ID, target,
   supplier, client and device public key.
   Tree identity is scoped to the creator.
   The payment mint must already be initialized and must be the singleton PDA.
4. `buy_shares(amount)`: transfer USDC into the funding vault and mint
   shares 1:1 in raw units. For example, 100 USDC buys 100 shares, and
   20,000 USDC fully funds a 20,000-share tree. Buying cannot exceed the target.
   Transfers are disabled until fully funded; mint authority is then revoked.
   Funding stays open until the target is reached. This MVP has no refund or
   cancellation path; contributed capital stays in the funding vault until purchase.
5. `purchase_tree`: creator releases exactly the target to a token account
   owned by the configured supplier. Extra unsolicited vault deposits do not
   issue shares or change the target. They have no withdrawal path in this MVP.
6. `activate_tree(first_day_start_ts)`: creator chooses a UTC midnight on or after
   January 1, 1970 as the automatic reporting start. Past days allow backfilling;
   future days schedule the start. This represents installation;
   the contract cannot verify installation or enforce a physical agreement.
7. `submit_report(day_start_ts, wh)`: the configured device key signs one transaction
   after the day ends, with the device’s unsigned **Wh** readings. The program
   stores the readings as supplied, without energy limits or a reading-count check.
   Any completed UTC day on or after January 1, 1970 can be reported in any order,
   including before the activation start. The automatic cursor becomes the later
   of its existing value and the submitted day's end, so historical submissions
   do not rewind it. Missing older days can be submitted explicitly.
   A unique report
   PDA prevents duplicates. `day_start_ts` is an i64 Unix timestamp in seconds
   aligned to UTC midnight. Zero production is valid. Reporting does not depend
   on prices or an invoice.
8. `issue_invoice(amount)`: the creator submits the final bill for a report
   in payment-mint base units (micro-USDC for USDC). The admin frontend
   builds the transaction and the creator signs it. Each invoice can be issued once;
   zero is valid and is distinguished from an invoice not yet issued.
9. `pay_invoice(amount)`: the configured client pays all or part of a report's
   bill in USDC. This payment, rather than the report, credits rewards.
10. `claim_rewards`: a holder withdraws their portion of paid revenue.
    `transfer_shares(amount)` checkpoints both holders before transferring.

## Tree initialization access

The global `AdminConfig` account is the PDA derived from `[b"admins"]`.
It stores 1 to 10 distinct nonzero admin public keys. Each listed admin can
independently call `init_tree`; there is no voting threshold or multisig.
An admin signs as `creator`, pays account rent, and owns the resulting tree's
creator role. Tree addresses remain scoped to that creator and tree ID.

After deploying, the program's **current upgrade authority** signs
`init_admins(admins)` once. Provide `authority`, this deployed `program`, its
loader-owned `program_data` account, the `admin_config` PDA, and System program.
The program verifies both the ProgramData link and its upgrade authority;
an arbitrary first caller cannot claim the list. Include the upgrade authority
in `admins` if it should also create trees: list management does not grant
implicit permission to create a tree.

`set_admins(admins)` replaces the list and requires the current upgrade
authority's signature, the same program/ProgramData accounts, and `admin_config`.
Listed admins cannot edit membership unless they are also the upgrade authority.
Both initialization and updates reject empty lists, more than 10 keys,
duplicates, and the zero public key. Changing the program's upgrade authority
also changes who can manage the list. Revoking upgrade authority permanently
disables list management; listed admins can still create trees.

Removing an admin immediately prevents new tree initialization by that wallet.
Existing trees retain their original creator and lifecycle permissions.
This admin list gates only tree initialization. Demo payment-token setup and
`give_me_money` remain permissionless. Existing deployments can initialize the
list after upgrading; tree account layouts do not change.

## Demo payment token and faucet

After deploying, call `init_payment_token` with a signing `payer`, the
`[b"payment_mint"]` PDA as `payment_mint`, its canonical Metaplex metadata PDA
as `payment_metadata`, and the Metaplex Token Metadata, classic SPL Token,
System, and Rent accounts. Initialization creates both the mint and metadata
atomically. The payer covers rent; initialization grants them no mint authority.

| Property                  | Value                                        |
| ------------------------- | -------------------------------------------- |
| Name                      | `USDC`                                       |
| Symbol                    | `USDC`                                       |
| Decimals                  | 6                                            |
| Initial supply            | 0                                            |
| Mint authority            | Payment mint PDA, controlled by this program |
| Freeze authority          | None                                         |
| Metadata update authority | Payment mint PDA                             |
| Metadata mutable          | No                                           |
| Metadata URI/image        | Empty / none                                 |
| Seller fee                | 0                                            |

`give_me_money(amount)` is a permissionless demo faucet. Any wallet can sign as
`owner` to mint the requested amount to its own canonical associated payment
account, which is created if needed. The caller pays rent and transaction fees.
Amounts are positive **raw units**: `give_me_money(100_000_000)` gives 100
USDC. Requests can be repeated with no per-wallet limit, cooldown, or
protocol supply cap; SPL Token's u64 supply limit still applies. There is no
issuer or backend approval. Wallets cannot call SPL `mint_to` directly because
the payment mint PDA is the mint authority.

Use the same mint when initializing every tree. Funding, supplier payments,
invoices, and reward claims reject other mints, including on trees created by
an older program version. Existing trees with another payment mint require a
separate migration; this change does not convert their vaults or balances.
A payment mint initialized by the previous implementation also requires its
existing authority to migrate mint authority and create metadata separately;
`init_payment_token` cannot initialize an existing mint again.

The faucet allows demonstration participants to mint USDC liquidity.
USDC models an institutional USDC-pegged RWA stablecoin backed 1:1 by USD reserves. An empty URI means
there is no hosted JSON metadata or image; the name and symbol are on-chain.

## Billing and rewards

The backend reads the production report and calculates the bill using its
tariff, currency conversion, and rounding rules. The contract stores only the
final invoice amount and payment state. It stores no energy prices, price
schedules, or billing remainder, and it does not verify the backend's pricing
calculation. The backend billing authority is trusted for invoice amounts.

Example backend calculation: 48 kWh at 0.10 USDC/kWh plus 48 kWh at
0.20 costs 14.40 USDC. The backend calls `issue_invoice(14_400_000)`.
With Alice holding 60% and Bob 40%, a 10-USDC payment gives them 6 and 4.
If Alice then sells every share to Carol, Alice retains those 6 USDC.
A subsequent 4.40-USDC payment gives Carol 2.64 and Bob 1.76.
Unpaid invoices follow ownership at the time the payment is received.

Rewards use a cumulative index with 10^18 precision. Positions retain
fractional micro-USDC between claims. Global division dust carries into later
payments. Tiny final fractions can remain unclaimable; there is no close or
dust-sweep instruction. Revenue is isolated from capital.

## Token account names

Instruction token accounts use descriptive `*_token_account` names:
`funding_token_account`, `revenue_token_account`, `payment_token_account`,
`share_token_account`, `recipient_share_token_account`, and
`supplier_payment_token_account`.

The share token accounts are canonical associated token accounts (ATAs).
Funding and revenue token accounts are PDA vaults created with program seeds.
Payment accounts are validated by mint and owner; they do not have to be ATAs.

## Transfer behavior

Share ATAs remain frozen outside program calls. The program atomically thaws,
mints/transfers, and freezes them again. This makes the reward ledger
authoritative and prevents direct SPL transfer or burn from bypassing it.
Use `transfer_shares`, rather than wallet-native SPL transfer. No Token-2022
transfer hook, NFT, senior/junior tranche, order book, or USDC yield strategy is
included. TREE-001 is an application label; Metaplex name/symbol metadata is
not created.

A secondary sale can combine the buyer's USDC payment and the seller's
`transfer_shares` instruction into one transaction signed by both parties.
If either instruction fails, both changes roll back. Settlement UI and order
matching are outside this program.

## Device and backend mock

The integration tests mock a Cerbo GX with a signing keypair and signed report
transactions. Authentication proves the configured key submitted the readings;
it does not prove physical production. Device provisioning, secure key storage,
key rotation, actual Victron access, and transaction retries are not implemented.

The backend indexes confirmed program events and reconciles the accounts.
`ProductionReported` identifies a report PDA storing the supplied readings, timestamp,
device key, energy total, whether an invoice was issued, amount due, and amount
paid. `InvoiceIssued`, `InvoicePaid`,
`SharesTransferred`, `RewardsClaimed`, and `TreeChanged` track the other flows.
Scan historical transactions when reconnecting; subscription logs alone are
not a durable index.

The tests mock the backend's final invoice amount, with no price oracle or
cloud dependency. The NestJS backend at `backend/` indexes events and tree state;
tariff integration is not implemented.
Report dates use **UTC** days. Reading counts and energy values are not validated. The invoice amount must be nonnegative; client credits
and invoice amendments are outside this MVP. Taxes, network fees, foreign
exchange, penalties, invoices/PDFs, and legal collection remain backend
concerns. There is no guaranteed return.

## Source layout

`Tree`, `Report`, `Position`, and `AdminConfig` each end with a 128-byte
`reserved` array, initialized to zero and preserved by ordinary updates.
Future fixed-size fields can consume this reserve by reducing its length by
the same serialized byte count. Account allocation includes the reserve, so
newly created accounts allocate it automatically. SPL mints, token accounts, and
Metaplex metadata retain their externally defined layouts.

Account sizes including the discriminator are 426 bytes for `Tree`, `245 + 4 × reading_count` for
`Report`, 240 for `Position`, and 460 for `AdminConfig` (capacity for 10 admins).
Accounts created before this reserve was introduced need a separate
reallocation/migration before the new layout can deserialize them. Upgrading
the program alone does not expand existing accounts.

The layout follows OnRe's instruction-family modules. Each instruction file
contains its own `#[derive(Accounts)]` struct and handler; `lib.rs` only
dispatches entrypoints.

- `src/instructions/initialization/`: admin configuration, singleton payment mint, demo faucet, and tree initialization.
- `src/instructions/funding/`: buying shares.
- `src/instructions/tree_operations/`: purchase, activation,
  and tree state.
- `src/instructions/energy/`: daily production reports and their state.
- `src/instructions/shares/`: transfers and investor position state.
- `src/instructions/rewards/`: backend-issued invoices, payments, claims, and reward math.
- `src/utils/token_utils.rs`: shared SPL CPI helpers.
- `src/constants.rs` and `src/errors.rs`: shared seeds, units, and errors.
- `tests/{admins,initialization,faucet,funding,energy,billing,shares,rewards}.rs`: domain integration tests.
- `tests/common/`: LiteSVM setup, faucet-issued demo balances, and account builders.

Daily report accounts are retained. Device wallets need SOL for
rent-exempt account creation as well as transaction fees; this MVP has no
pruning/closing instruction.

## Development

Run the following commands from the repository root.

Rust 1.98 is pinned for host builds; SBF platform tools v1.54 are pinned
separately. Cargo.lock records the compatible dependency set.
Install Anchor CLI 1.2.0 and Solana/Agave SBF tooling, then:

```sh
rtk proxy anchor build
rtk proxy solana program dump --url https://api.devnet.solana.com metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s target/deploy/mpl_token_metadata.so
rtk proxy cargo test -p treetino --tests
rtk proxy cargo fmt --all -- --check
rtk proxy cargo clippy -p treetino --all-targets -- -D warnings
```

Always rebuild before running LiteSVM: tests embed
`target/deploy/treetino.so`. Tests also execute the real Metaplex metadata
program downloaded above as `target/deploy/mpl_token_metadata.so`; this
read-only download needs no wallet or SOL and only needs to be run once. Account metas come from Anchor-generated
types, and the fee payer is separate from the instruction signer.

On machines affected by rustup's custom-toolchain parsing, build directly:

```sh
rtk proxy env PATH="$HOME/.cache/solana/v1.54/platform-tools/rust/bin:$PATH" cargo build-sbf --no-rustup-override --tools-version v1.54 --skip-tools-install
```

Run `rtk proxy bun run idl` from the repository root to regenerate the shared
IDL, TypeScript program type, and error codes in `packages/contracts/src/`.
Both applications import this package as `@treetino/contracts`.
Removing the energy limit changes `init_tree` arguments and the serialized
`Tree` and `Report` layouts. Deploy the rebuilt program together with the updated
IDL and clients. Existing accounts created under the previous layouts require
a separate migration or a fresh deployment before they can be used.

This repository does not deploy or spend devnet funds automatically.
Selected historical reporting requires deploying the rebuilt program; the older
program requires sequential days. This date-rule change preserves instruction
arguments and serialized account layouts, so compatible existing active trees
can backfill after upgrading without reinitialization.

The matching Anchor CLI was installed locally for this checkout at
`target/tooling/bin/anchor`; the existing global CLI was preserved.
