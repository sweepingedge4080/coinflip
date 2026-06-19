// ============================================================
//  CONFIG.JS - All Constants & Configuration
// ============================================================

// ----- GAME CONSTANTS -----
const PROGRESSIVE_MULTIPLIERS = [2, 3, 5, 8, 13, 21, 34, 55];
const HOUSE_EDGE = 0.11;
const WIN_CHANCE = 0.5 * (1 - HOUSE_EDGE);
const BASE_PAYOUT_MULTIPLIER = 2.0;

// ----- API URL (empty = same domain) -----
const API_BASE = '';

// ----- LOCAL STORAGE KEYS -----
const STORAGE_KEYS = {
    AUTH_TOKEN: 'authToken',
    ADMIN_TOKEN: 'adminAuthToken',
    ADMIN_USER: 'adminUser',
    PLAYER_STATE: 'coinflip_player'
};

// ----- DEFAULT SETTINGS -----
const DEFAULT_SETTINGS = {
    betAmount: 100,
    targetLevel: 5,
    delay: 1500,
    choice: 'heads'
};

// ----- LEVEL CONFIGURATION -----
const LEVEL_CONFIG = [
    { level: 1, xpRequired: 0, maxBet: 10, winBonus: 1.0 },
    { level: 2, xpRequired: 100, maxBet: 25, winBonus: 1.1 },
    { level: 3, xpRequired: 300, maxBet: 50, winBonus: 1.2 },
    { level: 4, xpRequired: 600, maxBet: 100, winBonus: 1.3 },
    { level: 5, xpRequired: 1000, maxBet: 200, winBonus: 1.5 },
    { level: 6, xpRequired: 1500, maxBet: 350, winBonus: 1.7 },
    { level: 7, xpRequired: 2100, maxBet: 500, winBonus: 2.0 },
    { level: 8, xpRequired: 2800, maxBet: 750, winBonus: 2.3 },
    { level: 9, xpRequired: 3600, maxBet: 1000, winBonus: 2.6 },
    { level: 10, xpRequired: 4500, maxBet: 1500, winBonus: 3.0 },
];

// ----- QR CODE MAPPING -----
const QR_MAP = {
    'Bitcoin (BTC)': 'qr-btc',
    'Ethereum (ETH)': 'qr-eth',
    'USDT (ERC20)': 'qr-usdt-erc20',
    'USDT (BEP20)': 'qr-usdt-bep20',
    'USDT (TRC20)': 'qr-usdt-trc20',
    'USDC (ERC20)': 'qr-usdc-erc20',
    'USDC (BEP20)': 'qr-usdc-bep20',
    'USDC (TRC20)': 'qr-usdc-trc20',
    'BNB (BSC)': 'qr-bnb',
    'Litecoin (LTC)': 'qr-ltc',
    'Solana (SOL)': 'qr-sol',
    'Dogecoin (DOGE)': 'qr-doge',
    'Ripple (XRP)': 'qr-xrp',
    'Cardano (ADA)': 'qr-ada',
    'Polkadot (DOT)': 'qr-dot',
    'Polygon (MATIC)': 'qr-matic',
    'Avalanche (AVAX)': 'qr-avax',
    'TRON (TRX)': 'qr-trx',
    'Monero (XMR)': 'qr-xmr',
    'TONCOIN (TON)': 'qr-ton',
    'Shiba Inu (SHIB)': 'qr-shib'
};

// ----- HELPER FUNCTIONS -----
function getLevelData(level) {
    return LEVEL_CONFIG.find(l => l.level === level) || LEVEL_CONFIG[0];
}

function getNextLevelData(level) {
    return LEVEL_CONFIG.find(l => l.level === level + 1);
}

function getMaxBet(level) {
    return getLevelData(level).maxBet;
}

function getWinBonus(level) {
    return getLevelData(level).winBonus;
}

function getXPToNext(level) {
    const next = getNextLevelData(level);
    return next ? next.xpRequired : Infinity;
}

function getProgressiveMultiplier(streak) {
    if (streak <= 0) return BASE_PAYOUT_MULTIPLIER;
    if (streak > PROGRESSIVE_MULTIPLIERS.length) {
        return PROGRESSIVE_MULTIPLIERS[PROGRESSIVE_MULTIPLIERS.length - 1];
    }
    return PROGRESSIVE_MULTIPLIERS[streak - 1];
}

// ----- LOGGING -----
function log(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    if (data) {
        console.log(`[${timestamp}] ${message}`, data);
    } else {
        console.log(`[${timestamp}] ${message}`);
    }
}

function logError(message, error = null) {
    const timestamp = new Date().toLocaleTimeString();
    if (error) {
        console.error(`[${timestamp}] ❌ ${message}`, error);
    } else {
        console.error(`[${timestamp}] ❌ ${message}`);
    }
}

function logWarning(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.warn(`[${timestamp}] ⚠️ ${message}`);
}

// ----- EXPOSE GLOBALLY -----
window.PROGRESSIVE_MULTIPLIERS = PROGRESSIVE_MULTIPLIERS;
window.HOUSE_EDGE = HOUSE_EDGE;
window.WIN_CHANCE = WIN_CHANCE;
window.BASE_PAYOUT_MULTIPLIER = BASE_PAYOUT_MULTIPLIER;
window.API_BASE = API_BASE;
window.STORAGE_KEYS = STORAGE_KEYS;
window.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
window.LEVEL_CONFIG = LEVEL_CONFIG;
window.QR_MAP = QR_MAP;
window.getLevelData = getLevelData;
window.getNextLevelData = getNextLevelData;
window.getMaxBet = getMaxBet;
window.getWinBonus = getWinBonus;
window.getXPToNext = getXPToNext;
window.getProgressiveMultiplier = getProgressiveMultiplier;
window.log = log;
window.logError = logError;
window.logWarning = logWarning;
