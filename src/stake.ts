import { Address, BigInt, store } from '@graphprotocol/graph-ts';

import { PoolInfo, PoolObj, Account, StakeDetail, StakeEvent, UntsakeEvent, HarvestEvent } from '../generated/schema';

import { Stake, UnStake, Pool, Harvested } from '../generated/StakeContract/StakeContract';

const ZERO = BigInt.fromU32(0);
const ONE = BigInt.fromU32(1);

function createNextPoolId(): string {
    const POOL_INFO_ID = '1';

    let poolInfo = PoolInfo.load(POOL_INFO_ID);

    if (poolInfo == null) {
        poolInfo = new PoolInfo(POOL_INFO_ID);
        poolInfo.count = ONE;
    } else {
        poolInfo.count = poolInfo.count.plus(ONE);
    }

    poolInfo.save();

    return poolInfo.count.toString();
}

function createAccount(address: Address): Account {
    const accountId = 'xdc' + address.toHexString().slice(2);
    let account = Account.load(accountId);

    if (account == null) {
        account = new Account(accountId);
        account.save();
    }

    return account;
}

function createStakeDetail(pool: PoolObj, account: Account, event: Stake): void {
    const objId = pool.id + '-' + account.id;
    const stakeDetail = new StakeDetail(objId);

    stakeDetail.pool = pool.id;
    stakeDetail.account = account.id;
    stakeDetail.amount = event.params._amount;
    stakeDetail.timestamp = event.block.timestamp;

    stakeDetail.save();
}

function removeStakeDetail(pool: PoolObj, account: Account): void {
    const id = pool.id + '-' + account.id;
    store.remove('MatrixTokenModule', id);
}

function createStakeEvent(pool: PoolObj, account: Account, event: Stake): void {
    const id = event.transaction.hash.toHexString() + '-' + pool.id + '-' + account.id;
    const stakeEvent = new StakeEvent(id);

    stakeEvent.pool = pool.id;
    stakeEvent.account = account.id;
    stakeEvent.amount = event.params._amount;
    stakeEvent.timestamp = event.block.timestamp;

    stakeEvent.save();
}

function createUnstakeEvent(pool: PoolObj, account: Account, event: UnStake): void {
    const id = event.transaction.hash.toHexString() + '-' + pool.id + '-' + account.id;
    const unstakeEvent = new UntsakeEvent(id);

    unstakeEvent.pool = pool.id;
    unstakeEvent.account = account.id;
    unstakeEvent.amount = event.params._amount;
    unstakeEvent.timestamp = event.block.timestamp;

    unstakeEvent.save();
}

function createHarvestEvent(pool: PoolObj, account: Account, event: Harvested): void {
    const id = event.transaction.hash.toHexString() + '-' + pool.id + '-' + account.id;
    const harvestEvent = new HarvestEvent(id);

    harvestEvent.pool = pool.id;
    harvestEvent.account = account.id;
    harvestEvent.amount = event.params._amount;
    harvestEvent.timestamp = event.block.timestamp;

    harvestEvent.save();
}

// event PoolObj(address _tokenaddress, address _rewardAddress,uint256 _rewardMultiplier, uint256 _rewardDivider, uint256 _item, string _name);
export function handPool(event: Pool): void {
    const id = createNextPoolId();
    let pool = new PoolObj(id);

    pool.tokenAddress = 'xdc' + event.params._tokenaddress.toHexString().slice(2);
    pool.rewardAddress = 'xdc' + event.params._rewardAddress.toHexString().slice(2);
    pool.rewardMutipiler = event.params._rewardMultiplier;
    pool.rewardDivider = event.params._rewardDivider;
    pool.totalStakeAmount = ZERO;
    pool.item = event.params._item;
    pool.name = event.params._name;

    pool.save();
}

// event Stake(address _user, uint256 _amount, uint256 _pool, uint256 _time);
export function handleStake(event: Stake): void {
    const poolId = event.params._pool.toString();
    let pool = PoolObj.load(poolId);

    if (pool == null) {
        throw new Error(`invalie poolId: ${poolId}`);
    } else {
        const account = createAccount(event.params._user);
        createStakeDetail(pool, account, event);
        createStakeEvent(pool, account, event);
    }
}

// event UnStake(address _user, uint256 _amount, uint256 _pool, uint256 _time);
export function handleUnstake(event: UnStake): void {
    const poolId = event.params._pool.toString();
    let pool = PoolObj.load(poolId);

    if (pool == null) {
        throw new Error(`invalie poolId: ${poolId}`);
    } else {
        const account = createAccount(event.params._user);
        removeStakeDetail(pool, account);
        createUnstakeEvent(pool, account, event);
    }
}

// event Harvested(address _user, uint256 _amount, uint256 _pool, uint256 _time);
export function handleHarvested(event: Harvested): void {
    const poolId = event.params._pool.toString();
    let pool = PoolObj.load(poolId);

    if (pool == null) {
        throw new Error(`invalie poolId: ${poolId}`);
    } else {
        const account = createAccount(event.params._user);
        createHarvestEvent(pool, account, event);
    }
}
