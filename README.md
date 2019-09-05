# System Architecture
[Two Vault Peg Stabletoken System](https://github.com/zachdoty/peg-busd/wiki/Two-Vault-Peg-Stabletoken-System)

# BUSD Bug Bounty
[BUSD Bug Bounty Details](https://peg.network/bounty.html)

# PEG Documentation

## PegLogic.sol
### Functions
```typescript
collateralValue(IVault _vault, address _borrower) public view validate(_vault, _borrower) returns(uint)
// Public view: Returns value of borrower's collateral
```

```typescript
liquidationPrice(IVault _vault, address _borrower) public view validate(_vault, _borrower) returns(uint)
// Public view: Price at which borrower's debt may be liquidated
```

```typescript
totalCredit(IVault _vault, address _borrower) public view validate(_vault, _borrower) returns (int256)
// Public view: Total amount of credit based on balance value * maximum borrow rate
```

```typescript
availableCredit(IVault _vault, address _borrower) public view returns (int256)
// Public view: returns credit available for borrowing
```

```typescript
minSafeBalance(IVault _vault, address _borrower) public view validate(_vault, _borrower) returns (uint256)
// Public view: Amount of collateral required to stay above maxBorrowLTV()
```

```typescript
minBalance(IVault _vault, address _borrower) public view validate(_vault, _borrower) returns (uint256)
// Public view: returns minimum collateral which will prevent the debt from being liquidated
```

```typescript
excessCollateral(IVault _vault, address _borrower) public view returns (int256)
// Public view: returns amount of collateral able to be withdrawn while keeping debt safe
```

```typescript
isInsolvent(IVault _vault, address _borrower) public view returns (bool)
// Public view: returns boolean, true if debt can be liquidated, false if debt is secure
```

```typescript
totalActualDebt(IVault _vault) public view returns(uint)
// Public view: Returns total amount of debt in the entire vault
```

```typescript
mintableAmount(IVault _vault) public view returns(uint)
// Public view: returns difference between the stable token's total supply and total debt
```

```typescript
ratioVaultABorrowed() public view returns(uint256)
// Public view: Returns the ratio of total debt in vault B to the total balance of vault A
```

```typescript
actualTotalBalance(IVault _vault) public view returns(uint256)
// Public view: Returns total collateral balance for a vault
```

```typescript
actualDebt(IVault _vault, address _address) public view returns(uint256)
// Public view: Returns actual scaled debt of borrower
```

```typescript
actualBalance(IVault _vault, address _address) public view returns(uint256)
// Public view: Returns actual balance scaled from raw balance
```

```typescript
adjustDebtStabilityFee(IVault _vault, bool _increaseStabilityFee) public authOnly
// Internal: Increases or decreases debt scaling (interest) rate
```

```typescript
adjustCollateralBorrowingRate() public authOnly
// Internal: Adjusts interest rate based on ratio of (A?) vault collateral borrowed
```

```typescript
processStabilityFee(IVault _vault) public
// Public: Checks mintableAmount() and mints appropriate number of tokens to fee recipient
```

```typescript
setCollateralBorrowingRate(int newRate) internal
// Internal: Sets debt and balance scaling rate for both vaults (A/B)
```

```typescript
mintStabletoken(address _to, uint _amount) internal
// Internal: Issues stable tokens to address
```

```typescript
getCollateralToken(IVault _vault) public view returns(IERC20Token)
// Returns the collateral token associated with a vault
```

```typescript
getDebtToken(IVault _vault) public view returns(IStableToken)
// Returns the debt/stable token associated with a vault
```

## Vault.sol
### Variables
```typescript
uint256 public rawTotalBalance;
// Total vault balance, unscaled

uint256 public rawTotalDebt;
// Total vault debt, unscaled

uint256 public collateralBorrowedRatio;
// Ratio of collateral deposited into Vault A versus quantity borrowed through Vault B

uint256 public amountMinted;
// Represents number of stabletokens minted for Vault A

uint256 public debtScalePrevious = 1e18;
// Debt scaling factor when last adjusted.

uint256 public debtScaleTimestamp = now;
// Timestamp of last debt scaling rate adjustment

int256 public debtScaleRate;
// Scales debt over time, interest payments

uint256 public balScalePrevious = 1e18;
// Balance scaling factor when last adjusted.

uint256 public balScaleTimestamp = now;
// Timestamp of last balance scaling rate adjustment

int256 public balScaleRate;
// Scales balance over time, interest earnings

uint32 public liquidationRatio = 850000;
// If individual debt value exceeds this value (85%) vs collateral allow liquidation

uint32 public maxBorrowLTV = 500000;
// Borrowing limit against collateral value (50%)

bool public borrowingEnabled = true;
// Can users borrow against their collateral

uint public biddingTime = 10800;
// Auction time limit: 3 hours
```

### Functions
```typescript
setBorrowingEnabled(bool _enabled) public authOnly
// Authorized only function, enables/disables borrowingEnabled
```

```typescript
create(address _borrower) public authOnly
// Helper used to validate, ensures a user has a vault entry
```

```typescript
setCollateralBorrowedRatio(uint _newRatio) public authOnly
// Authorized/internal: Track the ratio of collateral borrowed from Vault A to Vault B
```

```typescript
setAmountMinted(uint _amountMinted) public authOnly
// Authorized/internal: Update the amount of stabletokens minted from vault A
```

```typescript
setLiquidationRatio(uint32 _liquidationRatio) public authOnly
// Authorized/internal, allows setting of the liquidation ratio
```

```typescript
setMaxBorrowLTV(uint32 _maxBorrowLTV) public authOnly
// Internal, set maximum borrowing allowance
```

```typescript
setDebtScalingRate(int256 _debtScalingRate) public authOnly
// Internal: Updates debt scaling rate
```

```typescript
setBalanceScalingRate(int256 _balanceScalingRate) public authOnly
// Internal: Updates balance scaling rate
```

```typescript
setBiddingTime(uint _biddingTime) public authOnly
// Internal: Set auction bidding length
```

```typescript
setRawTotalBalance(uint _rawTotalBalance) public authOnly
// Internal: Updates raw total balance in vault
```

```typescript
setRawTotalDebt(uint _rawTotalDebt) public authOnly
// Internal: Updates raw total debt in vault
```

```typescript
setRawBalanceOf(address _borrower, uint _rawBalance) public authOnly
// Internal: Sets a borrower's raw balance
```

```typescript
setRawDebt(address _borrower, uint _rawDebt) public authOnly
// Internal: Sets a borrower's raw debt
```

```typescript
setTotalBorrowed(address _borrower, uint _totalBorrowed) public authOnly
// Internal: Set borrower's total amount borrowed
```

```typescript
debtScalingFactor() public view returns (uint)
// Returns debt scaling factor
```

```typescript
balanceScalingFactor() public view returns (uint)
// Returns balance scaling factor
```

```typescript
debtRawToActual(uint256 _raw) public view returns(uint256)
// Converts a raw debt into actual scaled debt
```

```typescript
debtActualToRaw(uint256 _actual) public view returns(uint256)
// Converts an actual debt into raw debt
```

```typescript
balanceRawToActual(uint256 _raw) public view returns(uint256)
// Converts a raw balance into actual scaled balance
```

```typescript
balanceActualToRaw(uint256 _actual) public view returns(uint256)
// Converts an actual balance into raw balance
```

```typescript
getVaults() public view returns (address[])
// Returns a list of all depositors in this vault
```

```typescript
transferERC20Token(IERC20Token _token, address _to, uint256 _amount) public authOnly
// Internal: Transfer tokens to specified address
```

```typescript
oracleValue() public view returns(uint)
// Returns the vault's oracle value
```

```typescript
setAuctionAddress(address _borrower, address _auction) public authOnly
// Internal: Setter for mapping which references auction
```

## Auction.sol
###  Variables
```typescript
address public borrower;
// Address of the depositor/borrower

uint public auctionEndTime;
// Timestamp determining when the auction will end

address public highestBidder;
// Address of highest bidder for current auction

uint256 public highestBid;
// Amount of highest bid for current auction

uint256 public amountToPay;
// Amount required to pay off debt

mapping(address => uint256) pendingReturns;
// Quantity of tokens pending return to an address

bool ended;
// Has the auction ended?
```

### Functions
```typescript
modifier authOnly()
// Function modifier which requires the calling address to be listed in the registry
```

```typescript
validateBid(uint256 _amount, uint256 _amountRelay) internal
// Validates bid to ensure that:
// 1. Bid is within auction time
// 2. Bid is not both minting relay tokens and refunding collateral at the same time
// 3. New bid is greater than previous bids
// 4. Bid does not attempt to return more than 100% of the collateral to the initial borrower
```

```typescript
bid(uint256 _amount, uint256 _amountRelay) public
// Places a bid on the current auction, accepts an actual value for bid and relay amounts.
// _amount refers to the amount of collateral that will be returned to the borrower.
// _amountRelay refers to the number of relay tokens the bidder wishes in addition to the collateral
// One or both values must be zero in order to be valid
// Every bid must be greater in value than the previous bid (validateBid)
```

```typescript
auctionEnd() public authOnly
// Internal: Ends an auction
```

```typescript
hasEnded() public view returns (bool)
// Public view: Answers whether or not an auction has ended
```

## AuctionActions.sol
### Functions
```typescript
startAuction(IVault _vault, address _borrower) public validate(_vault, _borrower) returns(address)
// Public to begin an auction on an insolvent debt.
// Sets raw balance and debt of this auction to match borrower's collateral/debt, then sets the borrower's collateral/debt to zero.
```

```typescript
endAuction(IVault _vault, address _borrower) public validate(_vault, _borrower)
// Public:
// 1. Adds the raw balance of the auction and subtracts the highest bid from the highest bidder.
// 2. Adds the highest bid to the borrower's balance
```

## LogicActions.sol
### Functions
```typescript
deposit(IVault _vault, uint256 _amount) public validate(_vault, msg.sender)
// Deposits an amount of tokens into a vault
// Increases user's raw balance by number of tokens deposited
```

```typescript
withdraw(IVault _vault, address _to, uint256 _amount) public validate(_vault, msg.sender)
// Verifies the borrower has excess collateral to withdraw, deducts the amount from their balance, and transfers the requested number of tokens to the user.
```

```typescript
borrow(IVault _vault, uint256 _amount) public validate(_vault, msg.sender)
// Verifies the borrower has sufficient available credit and borrows against their collateral
// Increases raw debt by amount borrowed
// For Vault A, mints stable token, for Vault B borrows from Vault A's balance.
```

```typescript
doPay(IVault _vault, address _payor, address _borrower, uint256 _amount, bool _all) internal
// Internal: Used to repay a debt. Called by repay(), repayAll(), and repayAuction()
```

```typescript
repay(IVault _vault, address _borrower, uint256 _amount) public validate(_vault, _borrower)
// Public: Repays an amount of the borrower's debt. Calls doPay()
```

```typescript
repayAll(IVault _vault, address _borrower) public validate(_vault, _borrower)
// Public: Repays a borrower's entire debt. Calls doPay()
```

## Oracle.sol
The oracle maintains the value of the collateral token. In order to update it, the oracle owner must first call updateValue() with the new value, then must confirm the value update with confirmValueUpdate(). This is to ensure that the proper value can be seen on chain prior to it being enabled, adding a layer of protection.
###  Variables
```typescript
uint256 public value = 1000000;
// Current Oracle Value

uint256 public newValue = 1000000;
// Staging new value to replace value
```

### Functions
```typescript
updateValue(uint256 _newValue) public ownerOnly
// Accepts a new oracle value to hold for confirmation as newValue
```

```typescript
confirmValueUpdate() public ownerOnly
// Sets oracle value to newValue.
```

```typescript
getValue() public view returns (uint256)
// Public: Gets current oracle value
```
