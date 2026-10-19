CREATE TABLE devices (
 site_id integer PRIMARY KEY, tree_address text NOT NULL UNIQUE, kind text NOT NULL,
 catalog jsonb NOT NULL, tariff_units_per_kwh numeric(30,0) NOT NULL CHECK(tariff_units_per_kwh >= 0),
 connection_fee_units numeric(30,0) NOT NULL CHECK(connection_fee_units >= 0),
 charging_power_watts integer NOT NULL DEFAULT 11000 CHECK(charging_power_watts > 0)
);
CREATE TABLE demo_wallets (wallet text PRIMARY KEY, balance_units numeric(30,0) NOT NULL DEFAULT 10000000000 CHECK(balance_units >= 0));
CREATE TABLE demo_deposits (id uuid PRIMARY KEY, wallet text NOT NULL, units numeric(30,0) NOT NULL CHECK(units > 0));
CREATE TABLE device_investments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source text NOT NULL UNIQUE,
 site_id integer NOT NULL REFERENCES devices(site_id), wallet text NOT NULL,
 units numeric(30,0) NOT NULL CHECK(units <> 0), method text NOT NULL, created_at bigint NOT NULL, memo_reference text
);
CREATE INDEX device_investments_site_wallet ON device_investments(site_id,wallet);
CREATE TABLE usage_sessions (
 id uuid PRIMARY KEY, site_id integer NOT NULL REFERENCES devices(site_id), wallet text NOT NULL,
 status text NOT NULL DEFAULT 'charging' CHECK(status IN ('charging','awaiting_payment','paid','cancelled')),
 target_wh integer NOT NULL CHECK(target_wh > 0), delivered_wh integer NOT NULL DEFAULT 0 CHECK(delivered_wh >= 0),
 power_watts integer NOT NULL CHECK(power_watts > 0), speed integer NOT NULL CHECK(speed > 0),
 tariff_units_per_kwh numeric(30,0) NOT NULL, connection_fee_units numeric(30,0) NOT NULL,
 amount_units numeric(30,0) NOT NULL DEFAULT 0 CHECK(amount_units >= 0), contributors jsonb NOT NULL,
 started_at bigint NOT NULL, stopped_at bigint, paid_at bigint, memo_reference text
);
CREATE TABLE device_claims (
 id uuid PRIMARY KEY, wallet text NOT NULL, site_id integer NOT NULL REFERENCES devices(site_id),
 units numeric(30,0) NOT NULL CHECK(units > 0), created_at bigint NOT NULL, memo_reference text
);
CREATE TABLE device_distributions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), session_id uuid NOT NULL REFERENCES usage_sessions(id),
 site_id integer NOT NULL REFERENCES devices(site_id), wallet text NOT NULL,
 units numeric(30,0) NOT NULL CHECK(units > 0), claim_id uuid REFERENCES device_claims(id), created_at bigint NOT NULL,
 CONSTRAINT device_distributions_session_wallet UNIQUE(session_id,wallet)
);
CREATE INDEX device_distributions_wallet ON device_distributions(wallet,site_id);
CREATE TABLE device_projection (source text PRIMARY KEY);
