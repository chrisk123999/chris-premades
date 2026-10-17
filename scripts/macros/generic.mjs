/****************************************************************************/
/*                              GENERIC MACROS                              */
/****************************************************************************/
/* Reusable automations that any document can use, configured per document. */
/****************************************************************************/

/*============================*/
/*         ANIMATIONS         */
/*============================*/
export { advancedMeleeAttack } from './generic/advancedMeleeAttack.mjs';
export { areaAnimation } from './generic/areaAnimation.mjs';
export { endIfUnaffected } from './generic/endIfUnaffected.mjs';
export { inheritCastLevel } from './generic/inheritCastLevel.mjs';
export { moveRegion } from './generic/moveRegion.mjs';
export { wallPanels, wallPermanence } from './generic/wallSpell.mjs';
export { reflectOnHit } from './generic/reflectOnHit.mjs';
export { spellAnimation } from './generic/spellAnimation.mjs';

/*============================*/
/*          BEHAVIOR          */
/*============================*/
export { damageBonusToOneRoll } from './generic/damageBonusToOneRoll.mjs';
export { rerollCheckWithBonus, rerollSaveWithBonus, rerollSkillWithBonus, rerollToolWithBonus } from './generic/rerollWithBonus.mjs';
export { attackBonus, checkBonus, saveBonus, skillBonus, toolBonus } from './generic/rollBonus.mjs';

/*============================*/
/*           DAMAGE           */
/*============================*/
export { attackRider } from './generic/attackRider.mjs';
export { bladeSpell } from './generic/bladeSpell.mjs';
export { negateDamageFromEffect } from './generic/negateDamageFromEffect.mjs';
export { nextHitRider } from './generic/nextHitRider.mjs';
export { selectDamageType } from './generic/selectDamageType.mjs';

/*============================*/
/*         MECHANICS          */
/*============================*/
export { banish } from './generic/banish.mjs';
export { conditionAutoSave } from './generic/conditionAutoSave.mjs';
export { hide } from './generic/hide.mjs';
export { ignoreCover } from './generic/ignoreCover.mjs';
export { preventDeath } from './generic/preventDeath.mjs';
export { reduceMaxHP } from './generic/reduceMaxHP.mjs';
export { saveToEndWhenFar } from './generic/saveToEndWhenFar.mjs';
export { unhideActivities } from './generic/unhideActivities.mjs';

/*============================*/
/*          MOVEMENT          */
/*============================*/
export { movementAnimation } from './generic/movementAnimation.mjs';
export { teleport } from './generic/teleport.mjs';

/*============================*/
/*          SUMMONS           */
/*============================*/
export { summonModifier } from './generic/summonModifier.mjs';

/*============================*/
/*         TARGETING          */
/*============================*/
export { additionalTargets } from './generic/additionalTargets.mjs';
export { auraDesignation, grappledBySource, notDesignatedBySource, summonerOfSource } from './generic/auraFilters.mjs';
export { extraAttack } from './generic/extraAttack.mjs';
export { multiSingleTarget } from './generic/multiSingleTarget.mjs';
export { redirectAttack } from './generic/redirectAttack.mjs';
export { targetCreatureTypes } from './generic/targetCreatureTypes.mjs';

/*============================*/
/*          UTILITY           */
/*============================*/
export { actionDismissal } from './generic/actionDismissal.mjs';
export { choiceRemoveCondition, turnEndChoiceRemoveCondition, turnStartChoiceRemoveCondition } from './generic/choiceRemoveCondition.mjs';
export { contestedCheck } from './generic/contestedCheck.mjs';
export { pullOnFail, pullOnHit, pushOnFail } from './generic/forcedMovement.mjs';
export { grapple } from './generic/grapple.mjs';
export { itemRecovery } from './generic/itemRecovery.mjs';
export { proficiencyChoice } from './generic/proficiencyChoice.mjs';
export { proneOnFail } from './generic/proneOnFail.mjs';
export { proneOnHit } from './generic/proneOnHit.mjs';
export { removeRegion } from './generic/removeRegion.mjs';
export { restoreUses } from './generic/restoreUses.mjs';
export { checkModifier, saveModifier, skillModifier, toolModifier } from './generic/rollModifier.mjs';
export { specialItemUse } from './generic/specialItemUse.mjs';
export { useOnDeath } from './generic/useOnDeath.mjs';
export { useOnEvent } from './generic/useOnEvent.mjs';
