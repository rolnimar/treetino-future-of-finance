pub const DAY: i64 = 86_400;
pub const SCALE: u128 = 1_000_000_000_000_000_000;
pub const PAYMENT_TOKEN_NAME: &str = "USDC";
pub const PAYMENT_TOKEN_SYMBOL: &str = "USDC";
pub const MAX_ADMINS: usize = 10;

pub mod seeds {
    pub const ADMINS: &[u8] = b"admins";
    pub const PAYMENT_MINT: &[u8] = b"payment_mint";
    pub const TREE: &[u8] = b"tree";
    pub const SHARES: &[u8] = b"shares";
    pub const FUNDING: &[u8] = b"funding";
    pub const REVENUE: &[u8] = b"revenue";
    pub const POSITION: &[u8] = b"position";
    pub const REPORT: &[u8] = b"report";
}
