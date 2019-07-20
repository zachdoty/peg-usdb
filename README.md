# PEG Documentation

## PegLogic.sol
### actualBalance() public view
Inputs: vault, borrower
Returns: Actual balance scaled from raw balance
    balanceRawToActual(rawBalanceOf(borrower))

### collateralValue() public view 
Inputs: vault, borrower 
Returns: Value of borrower's collateral
    actualBalance() * oracleValue()

### liquidationPrice() public view
Inputs: vault, borrower
Returns: Price at which borrower's debt may be liquidated
    actualBalance() * liquidationRatio()

### totalCredit() public view
Inputs: vault, borrower
Returns: Total amount of credit based on balance value * maximum borrow rate
    collateralValue() * maxBorrowLTV()

### actualDebt() public view
Inputs: vault, borrower
Returns: Actual scaled debt of borrower
    debtRawToActual(rawDebt(borrower))

### availableCredit() public view
Inputs: vault, borrower
Returns: Credit available for borrowing
    totalCredit() - actualDebt()

### minSafeCollateral() public view 
Inputs: vault, borrower
Returns: Amount of collateral required to stay above maxBorrowLTV()
    actualDebt() / oracleValue() / maxBorrowLTV()

### minLiquidationCollateral() public view
Inputs: vault, borrower
Returns: Minimum collateral which will prevent the debt from being liquidated
    actualDebt() / oracleValue() / liquidationRatio()

### excessCollateral() public view
Inputs: vault, borrower
Returns: Amount of collateral able to be withdrawn while keeping debt safe
    actualBalance()) - minSafeCollateral()

### isInsolvent() public view 
Inputs: vault, borrower
Returns: Boolean, true if debt can be liquidated, false if debt is secure
    actualBalance() < minLiquidationCollateral()

### totalActualDebt() public view
Inputs: vault
Returns: Total amount of debt in the entire vault
    debtRawToActual(rawTotalDebt())

### ratioVaultABorrowed() public view
Inputs: none
Returns: The ratio of total debt in vault B to the total balance of vault A
    vaultB().debtRawToActual(vaultB().rawTotalDebt()) / actualTotalBalance(vaultA())

### actualTotalBalance() public view
Inputs: vault
Returns: Total collateral balance for a vault
    balanceRawToActual(rawTotalBalance())

### mintableAmount() public view
Inputs: vault
Returns: Difference between the stable token's total supply and total debt
    totalActualDebt() - stableToken().totalSupply()

### deposit() public
Inputs: vault, amount
Returns:
Deposits the collateral token of vault on behalf of the sender
    Calls adjustCollateralBorrowingRate()

### withdraw() public
Inputs: vault, address, amount
Returns:
Withdraws collateral only if the vault has excess collateral
    Calls adjustCollateralBorrowingRate()

### borrow() public
Inputs: vault, amount
Returns:
Checks for availableCredit() and borrows the requested amount of tokens from the specified vault.
If this is on the (B?) vault it withdraws them from the collateral in the (A?) vault.
    Calls adjustCollateralBorrowingRate()

### repay() public
Inputs: vault, borrower, amount
Returns: 
Transfers or destroys tokens from user and repays borrower's corresponding debt
    Calls adjustCollateralBorrowingRate()

### repayAll() public
Inputs: vault, borrower
Returns: 
Repays a borrower's entire debt. Wrapper for repay()

### liquidate() public
Inputs: vault, borrower
Returns: 
Todo: Update once logic is finished
Purchases a borrower's collateral by repaying debt.
    Calls adjustCollateralBorrowingRate()

### adjustDebtStabilityFee()
Inputs: vault, increaseStabilityFee
Returns: 
Increases or decreases debt scaling (interest) rate

### adjustCollateralBorrowingRate()
Inputs: 
Returns: 
Adjusts interest rate based on ratio of (A?) vault collateral borrowed

### setCollateralBorrowingRate(int newRate)
Inputs: 
Returns: 
Sets debt and balance scaling rate for both vaults (A/B)

### mintStabletoken()
Inputs: to, amount
Returns: 
Issues stable tokens to address

### processStabilityFee(IVault _vault) public
Inputs: vault
Returns:
Checks mintableAmount() and mints appropriate number of tokens to fee recipient
    mintStabletoken(registry.addressOf(ContractIds.FEE_RECIPIENT), mintableAmount(_vault));

## Vault.sol

```typescript
function rawTotalBalance() public view returns (uint256);
// Total vault balance, unscaled
```

```typescript
rawTotalDebt
// Total vault debt, unscaled
```

```typescript
collateralBorrowedRatio
// Ratio of collateral deposited into Vault A versus quantity borrowed through Vault B
```

```typescript
amountMinted
// Represents number of stabletokens minted for Vault A
```

```typescript
debtScalePrevious = 1e18
// Todo
```

```typescript
debtScaleTimestamp = now
// Todo (time debt starts scaling...?)
```

```typescript
debtScaleRate
// Scales debt over time, interest payments
```

```typescript
balScalePrevious = 1e18
// Todo
```

```typescript
balScaleTimestamp = now
// Todo
```

```typescript
balScaleRate
// Scales balance over time, interest earnings
```

```typescript
liquidationRatio = 850000
// If individual debt value exceeds this value (85%) vs collateral allow liquidation
```

```typescript
maxBorrowLTV = 500000
// Borrowing limit against collateral value (50%)
```

```typescript
borrowingEnabled = true
// Can users borrow against their collateral
```

```typescript
biddingTime = 10800
// Auction time limit: 3 hours
```

```typescript
setBorrowingEnabled(bool)
// Authorized only function, enables/disables borrowingEnabled
```

```typescript
create(address)
// Helper used to validate, ensures a user has a vault entry
```

```typescript
setCollateralBorrowedRatio(uint)
// Authorized/internal: Track the ratio of collateral borrowed from Vault A to Vault B
```

```typescript
setAmountMinted(uint)
// Authorized/internal: Update the amount of stabletokens minted from vault A
```

```typescript
setLiquidationRatio(uint32 _liquidationRatio) public authOnly {
// Authorized/internal, allows setting of the liquidation ratio
```

```typescript
setMaxBorrowLTV(uint32)
// Internal, set maximum borrowing allowance
```

```typescript
setDebtScalingRate(int256 _debtScalingRate) public authOnly {
// Internal: Updates debt scaling rate
```

```typescript
setBalanceScalingRate(int256 _balanceScalingRate) public authOnly {
// Internal: Updates balance scaling rate
```

```typescript
setBiddingTime(uint _biddingTime) public authOnly {
// Internal: Set auction bidding length
```

```typescript
setRawTotalBalance(uint _rawTotalBalance) public authOnly {
// Internal: Updates raw total balance in vault
```

```typescript
setRawTotalDebt(uint _rawTotalDebt) public authOnly {
// Internal: Updates raw total debt in vault
```

```typescript
setRawBalanceOf(address _borrower, uint _rawBalance) public authOnly {
// Internal: Sets a borrower's raw balance
```

```typescript
setRawDebt(address _borrower, uint _rawDebt) public authOnly {
// Internal: Sets a borrower's raw debt
```

```typescript
setTotalBorrowed(address _borrower, uint _totalBorrowed) public authOnly {
// Internal: Set borrower's total amount borrowed
```

```typescript
debtScalingFactor() public view returns (uint) {
// Returns debt scaling factor
```

```typescript
balanceScalingFactor() public view returns (uint) {
// Returns balance scaling factor
```

```typescript
debtRawToActual(uint256 _raw) public view returns(uint256) {
// Converts a raw debt into actual scaled debt
```

```typescript
debtActualToRaw(uint256 _actual) public view returns(uint256) {
// Converts an actual debt into raw debt
```

```typescript
balanceRawToActual(uint256 _raw) public view returns(uint256) {
// Converts a raw balance into actual scaled balance
```

```typescript
balanceActualToRaw(uint256 _actual) public view returns(uint256) {
// Converts an actual balance into raw balance
```

```typescript
getVaults() public view returns (address[]) {
// Todo: Clarify - Returns vault addresses
```

```typescript
transferERC20Token(IERC20Token _token, address _to, uint256 _amount) public authOnly {
// Internal: Transfer tokens to specified address
```

```typescript
oracleValue() public view returns(uint) {
// Returns the vault's oracle value
```

```typescript
setAuctionAddress(address _borrower, address _auction) public authOnly {
// Internal: Todo
```

## Auction.sol

###  Variables
```typescript
address public borrower;
IVault public vault;
IContractRegistry public registry;
uint public auctionEndTime;
address public highestBidder;
uint256 public highestBid;
uint256 public amountToPay;
mapping(address => uint256) pendingReturns;
bool ended;
```

```typescript
modifier authOnly() {
// Function modifier which requires the calling address to be listed in the registry
```

```typescript
function bid(uint256 _amount) public {
// Places a bid on the current auction
// Increases end time by biddingTime
// Deposits _amount of tokens in order to place bid
// Repays vault debt
```

```typescript
function auctionEnd() public authOnly {
// Internal: Ends an auction
```

## AuctionActions.sol
```typescript
    function startAuction(IVault _vault, address _borrower) public validate(_vault, _borrower) returns(address) {
// Public function to begin an auction on an insolvent debt.
// Sets raw balance and debt of this auction to match borrower's collateral/debt, then sets the borrower's collateral/debt to zero.
```

```typescript
    function endAuction(IVault _vault, address _borrower) public validate(_vault, _borrower) {
// Public:
// 1. Adds the raw balance of the auction and subtracts the highest bid from the highest bidder.
// 2. Adds the highest bid to the borrower's balance
```

## LogicActions.sol
```typescript
function deposit(IVault _vault, uint256 _amount) public validate(_vault, msg.sender) {
// Deposits an amount of tokens into a vault
// Increases user's raw balance by number of tokens deposited
```

```typescript
function withdraw(IVault _vault, address _to, uint256 _amount) public validate(_vault, msg.sender) {
// Verifies the borrower has excess collateral to withdraw, deducts the amount from their balance, and transfers the requested number of tokens to the user.
```

```typescript
function borrow(IVault _vault, uint256 _amount) public validate(_vault, msg.sender) {
// Verifies the borrower has sufficient available credit and borrows against their collateral
// Increases raw debt by amount borrowed
// For Vault A, mints stable token, for Vault B borrows from Vault A's balance.
```

```typescript
function doPay(IVault _vault, address _payor, address _borrower, uint256 _amount, bool _all) internal {
// Todo
// This appears to pay another user's debt off, used internally?
```

```typescript
function repay(IVault _vault, address _borrower, uint256 _amount) public validate(_vault, _borrower) {
// Public: Repays an amount of the borrower's debt. Calls doPay()
```

```typescript
function repayAll(IVault _vault, address _borrower) public validate(_vault, _borrower) {
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

```typescript
function updateValue(uint256 _newValue) public ownerOnly {
// Accepts a new oracle value to hold for confirmation as newValue
```

```typescript
function confirmValueUpdate() public ownerOnly {
// Sets oracle value to newValue.
```

```typescript
function getValue() public view returns (uint256) {
// Public: Gets current oracle value
```