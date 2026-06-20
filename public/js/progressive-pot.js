// ============================================================
//  PROGRESSIVE-POT.JS - Isolated Progressive Pot System
// ============================================================

// ----- STATE -----
let progressivePotState = {
    // The isolated bet amount (deducted from balance at start)
    isolatedBet: 0,
    // Current level reached (0 = no wins yet)
    currentLevel: 0,
    // Is there an active progressive run?
    isActive: false,
    // Track if we've already deducted the bet
    betDeducted: false,
    // The player's balance at the start of the run (for reference)
    startBalance: 0,
    // Pot value (bet * multiplier at current level)
    potValue: 0
};

// ============================================================
//  PROGRESSIVE POT FUNCTIONS
// ============================================================

function startProgressivePot(betAmount) {
    console.log('🔥 Starting progressive pot with bet:', betAmount);
    
    // Reset state
    progressivePotState.isActive = true;
    progressivePotState.isolatedBet = betAmount;
    progressivePotState.currentLevel = 0;
    progressivePotState.betDeducted = true; // Bet was already deducted by the server
    progressivePotState.startBalance = currentUserData ? currentUserData.balance : 0;
    progressivePotState.potValue = betAmount * 2; // Level 1 is 2x
    
    console.log('📊 Progressive pot state:', progressivePotState);
    return progressivePotState;
}

function advanceProgressivePot(newLevel) {
    if (!progressivePotState.isActive) {
        console.warn('⚠️ No active progressive pot to advance');
        return null;
    }
    
    progressivePotState.currentLevel = newLevel;
    
    const multiplier = getProgressiveMultiplier(newLevel);
    progressivePotState.potValue = progressivePotState.isolatedBet * multiplier;
    
    console.log(`⬆️ Advanced to Level ${newLevel}, Pot: $${progressivePotState.potValue.toFixed(2)} (${multiplier}x)`);
    return progressivePotState;
}

function cashoutProgressivePot() {
    if (!progressivePotState.isActive) {
        console.warn('⚠️ No active progressive pot to cash out');
        return null;
    }
    
    if (progressivePotState.currentLevel === 0) {
        console.warn('⚠️ No winnings to cash out (Level 0)');
        return null;
    }
    
    const potValue = progressivePotState.potValue;
    const isolatedBet = progressivePotState.isolatedBet;
    const netProfit = potValue - isolatedBet;
    
    console.log(`💰 Cashing out progressive pot: $${potValue.toFixed(2)} (net profit: $${netProfit.toFixed(2)})`);
    
    // Reset the pot
    const result = {
        potValue: potValue,
        isolatedBet: isolatedBet,
        netProfit: netProfit,
        level: progressivePotState.currentLevel,
        multiplier: getProgressiveMultiplier(progressivePotState.currentLevel)
    };
    
    resetProgressivePot();
    
    return result;
}

function bustProgressivePot() {
    if (!progressivePotState.isActive) {
        console.warn('⚠️ No active progressive pot to bust');
        return null;
    }
    
    const isolatedBet = progressivePotState.isolatedBet;
    const level = progressivePotState.currentLevel;
    const lostAmount = progressivePotState.potValue || (isolatedBet * 2);
    
    console.log(`💀 BUSTED! Lost progressive pot: $${lostAmount.toFixed(2)} at Level ${level}`);
    
    const result = {
        lostAmount: lostAmount,
        isolatedBet: isolatedBet,
        level: level
    };
    
    resetProgressivePot();
    
    return result;
}

function resetProgressivePot() {
    console.log('🔄 Resetting progressive pot');
    progressivePotState.isActive = false;
    progressivePotState.isolatedBet = 0;
    progressivePotState.currentLevel = 0;
    progressivePotState.betDeducted = false;
    progressivePotState.startBalance = 0;
    progressivePotState.potValue = 0;
}

function getProgressivePotState() {
    return { ...progressivePotState };
}

function getProgressiveMultiplier(level) {
    const multipliers = [2, 3, 5, 8, 13, 21, 34, 55];
    if (level <= 0) return 2;
    if (level > multipliers.length) return multipliers[multipliers.length - 1];
    return multipliers[level - 1];
}

// ============================================================
//  EXPOSE GLOBALLY
// ============================================================

window.progressivePotState = progressivePotState;
window.startProgressivePot = startProgressivePot;
window.advanceProgressivePot = advanceProgressivePot;
window.cashoutProgressivePot = cashoutProgressivePot;
window.bustProgressivePot = bustProgressivePot;
window.resetProgressivePot = resetProgressivePot;
window.getProgressivePotState = getProgressivePotState;
window.getProgressiveMultiplier = getProgressiveMultiplier;

console.log('🔥 Progressive Pot system loaded');
