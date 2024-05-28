339 macros in "macros"

Helper functions:

Their own monsters: 
aimCrosshair - 10
remoteAimCrosshair - 1
spawn - 6

All {
    getConfiguration - 246
    setConfiguration - 1
    getItem - 146

    getItemDescription - 249
    getItemFromCompendium - 271
    getCompendiumItemDescription - 1

    lastGM - 14
    isLastGM - 6
    checkPermission - 1
    updateTargets - 26

    addDependents - 30

    functionToString - 86
    sizeStringValue - 4
    decimalToFraction - 2 (in helper)
    nth - 2
    titleCase - 3
}

Dialogs - Appv2 {
    dialog - 203
    numberDialog - external, 1
    selectTarget - 44
    remoteDialog - 15
    menu - 19
    remoteMenu - 5
    remoteSelectTarget - 1
    selectDocument - 32
    selectDocuments - 4
    remoteDocumentDialog - 6
    remoteDocumentsDialog - 4
        useSpellWhenEmpty - 1
}

Effects {
    findEffect - 346
    createEffect - 181
    removeEffect - 173
    updateEffect - 84
    getEffectCastLevel - 2
}

Damage/Workflow manipulation {
    applyDamage - 45
    applyWorkflowDamage - 10
    addToRoll - 9
    totalDamageType - 10
    getRollDamageTypes - 8
    getRollsDamageTypes - 9
    addToDamageRoll - 46
    damageRoll - 43
    damageRolls - 1
        addDamageDetailDamage - 4
        removeDamageDetailDamage - 1
        getCriticalFormula - 6
}

actor manipulation - 
    checkTrait - 36
    raceOrType - 24
    getSize - 24
    getEffects - 56
    addCondition - 48
    removeCondition - 29
    increaseExhaustion - 2
    levelOrCR - 12

item manipulation - 
    getSpellDC - 71
    getSpellMod - 47
    itemDuration - 2

module checks {
    jb2aCheck - 82
    aseCheck - 44
    hasEpicRolls - 1
    vision5e - 1
}

checkCover - 2 (in helpers)

Token manipulation {
    findNearby - 51
    getDistance - 61
    getCoordDistance - 2
    getGridBetweenTokens - 1
    checkForRoom - 3
    findDirection - 3 ^ same as
    canSense - 1
    checkLight - 2
    pushTokenAlongRay - 1
    pushToken - 7
}

createTemplate - 4
placeTemplate - 4
tokenInTemplate - 2
tokenTemplates - 5
templateTokens - 2
findGrids - 1

inCombat - 57
perTurnCheck - 36
setTurnCheck - 25
updateCombatant - 2
getCombatant - 1

/* likely won't need?
addTempItem - 7
removeTempItems- 8
getTempItem - 6
*/

firstOwner - 17 - reaction dialogs
rollRequest - 3
thirdPartyReactionMessage - 7
clearThirdPartyReactionMessage - 7
gmDialogMessage - 4
clearGMDialogMessage - 4
rollItem - 2 (internal)
remoteRollItem - 1

getMonsterFeatureSearchCompendiums - 1 internal
getSearchCompendiums - 1

createFolder X
createActor X

safeMutate X
safeRevert X
animationCheck X