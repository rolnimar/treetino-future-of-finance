// Dedicated devnet funding pools for this project's featured campaigns.
export const FLAGSHIP_CREATOR = '9tTUg7r9ftofzoPXKeUPB35oN4Lm8KkrVDVQbbM7Xzxx';
export const FLAGSHIP_FUNDING: Record<
  number,
  { treeId: string; address: string; targetUsdc: string }
> = {
  209689: {
    treeId: '202610190209689',
    address: 'C22QhgXS4SkTw8awMSZVbiNTeBb75q3SbX158P287tjV',
    targetUsdc: '1850000',
  },
  219742: {
    treeId: '202610190219742',
    address: 'D8vCgCmfVgxB6SPaRZzo7SDDxZxz2iav1ypLQuJnfiCH',
    targetUsdc: '108000',
  },
  374891: {
    treeId: '202610190374891',
    address: 'E3HZY2zUYhePGQyE2TK1A6SUfwS1C5J5DLvHeiMt6US1',
    targetUsdc: '100000',
  },
  100001: {
    treeId: '202610190100001',
    address: 'FU9Q4766CmJ5XpaRocXQa5uDN3wTygutwxAbtYzgMrrN',
    targetUsdc: '235000',
  },
};
