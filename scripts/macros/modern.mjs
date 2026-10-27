/****************************************************************************/
/*                                2024 RULES                                */
/****************************************************************************/
/* Automations for 2024 rules only. Folder: macros/modern.                  */
/*                                                                          */
/* Lookups for 2024 items check this file first, then all.mjs.              */
/****************************************************************************/

/*===============================*/
/*        CLASS FEATURES         */
/*===============================*/

/*********************************/
/*           Artificer           */
/*********************************/
export { magicItemTinker as 'magic-item-tinker', magicItemTinkerCharge, magicItemTinkerDrain, magicItemTinkerTransmute } from './modern/classFeatures/artificer/magicItemTinker.mjs';
export { replicateMagicItem as 'replicate-magic-item' } from './modern/classFeatures/artificer/replicateMagicItem.mjs';
export { soulOfArtifice as 'soul-of-artifice' } from './modern/classFeatures/artificer/soulOfArtifice.mjs';
export { tinkersMagic as 'tinkers-magic' } from './modern/classFeatures/artificer/tinkersMagic.mjs';

/*         Cartographer          */
export { adventurersAtlas as 'adventurers-atlas' } from './modern/classFeatures/artificer/cartographer/adventurersAtlas.mjs';
export { guidedPrecision as 'guided-precision' } from './modern/classFeatures/artificer/cartographer/guidedPrecision.mjs';
export { ingeniousMovement as 'ingenious-movement' } from './modern/classFeatures/artificer/cartographer/ingeniousMovement.mjs';
export { mappingMagic as 'mapping-magic' } from './modern/classFeatures/artificer/cartographer/mappingMagic.mjs';
export { superiorAtlas as 'superior-atlas', superiorAtlasSafeHaven } from './modern/classFeatures/artificer/cartographer/superiorAtlas.mjs';

/*********************************/
/*           Barbarian           */
/*********************************/
export { brutalStrike as 'brutal-strike', forcefulBlow } from './modern/classFeatures/barbarian/brutalStrike.mjs';
export { indomitableMight as 'indomitable-might' } from './modern/classFeatures/barbarian/imdomitableMight.mjs';
export { improvedBrutalStrike as 'improved-brutal-strike', sunderingBlow } from './modern/classFeatures/barbarian/improvedBrutalStrike.mjs';
export { persistentRage as 'persistent-rage' } from './modern/classFeatures/barbarian/persistentRage.mjs';
export { primalKnowldege as 'primal-knowledge', primalKnowledgeEffect } from './modern/classFeatures/barbarian/primalKnowledge.mjs';
export { extendRage, keepRage } from './modern/classFeatures/barbarian/rage.mjs';

/*           Berserker           */
export { intimidatingPresence as 'intimidating-presence' } from './modern/classFeatures/barbarian/berserker/intimidatingPresence.mjs';

/*         Muscle Wizard         */
export { unarguableWizardry as 'unarguable-wizardry' } from './modern/classFeatures/barbarian/muscleWizard/unarguableWizardry.mjs';

/*          Wild Heart           */
export { aspectOfTheWilds as 'aspect-of-the-wilds' } from './modern/classFeatures/barbarian/wildHeart/aspectOfTheWilds.mjs';

/*********************************/
/*             Bard              */
/*********************************/
export { countercharm } from './modern/classFeatures/bard/countercharm.mjs';
export { fontOfInspiration as 'font-of-inspiration' } from './modern/classFeatures/bard/fontOfInspiration.mjs';

/*********************************/
/*            Cleric             */
/*********************************/
export { channelDivinity as 'channel-divinity|class:cleric', divineSparkDamage, turnUndead } from './modern/classFeatures/cleric/channelDivinity.mjs';
export { divineIntervention as 'divine-intervention' } from './modern/classFeatures/cleric/divineIntervention.mjs';
export { divineStrike as 'blessed-strikes-divine-strike' } from './modern/classFeatures/cleric/divineStrike.mjs';
export { greaterDivineIntervention as 'greater-divine-intervention', greaterDivineInterventionRest as 'greater-divine-intervention-rest' } from './modern/classFeatures/cleric/greaterDivineIntervention.mjs';
export { improvedPotentSpellcasting as 'improved-blessed-strikes' } from './modern/classFeatures/cleric/improvedPotentSpellcasting.mjs';

/*             Life              */
export { discipleOfLife as 'disciple-of-life' } from './modern/classFeatures/cleric/life/discipleOfLife.mjs';

/*             Light             */
export { improvedWardingFlare as 'improved-warding-flare' } from './modern/classFeatures/cleric/light/improvedWardingFlare.mjs';
export { wardingFlare as 'warding-flare' } from './modern/classFeatures/cleric/light/wardingFlare.mjs';

/*           Trickery            */
export { blessingOfTheTrickster as 'blessing-of-the-trickster' } from './modern/classFeatures/cleric/trickery/blessingOfTheTrickster.mjs';

/*********************************/
/*             Druid             */
/*********************************/
export { archdruid } from './modern/classFeatures/druid/archdruid.mjs';
export { primalStrike as 'elemental-fury-primal-strike' } from './modern/classFeatures/druid/primalStrike.mjs';
export { wildResurgence as 'wild-resurgence' } from './modern/classFeatures/druid/wildResurgence.mjs';
export { wildShape as 'wild-shape' } from './modern/classFeatures/druid/wildShape.mjs';

/*             Moon              */
export { lunarForm as 'lunar-form' } from './modern/classFeatures/druid/moon/lunarForm.mjs';

/*            Wicker             */
export { bewitchedEffigy as 'bewitched-effigy', bewitchedEffigySacrifice as 'bewitched-effigy-sacrifice' } from './modern/classFeatures/druid/wicker/bewitchedEffigy.mjs';
export { soulboundPoppet as 'soulbound-poppet', soulboundPoppetDoll as 'soulbound-poppet-doll' } from './modern/classFeatures/druid/wicker/soulboundPoppet.mjs';
export { wickerRising as 'wicker-rising' } from './modern/classFeatures/druid/wicker/wickerRising.mjs';
export { wickerToken as 'wicker-token' } from './modern/classFeatures/druid/wicker/wickerToken.mjs';
export { wickerZenith as 'wicker-zenith' } from './modern/classFeatures/druid/wicker/wickerZenith.mjs';

/*********************************/
/*            Fighter            */
/*********************************/
export { studiedAttacks as 'studied-attacks' } from './modern/classFeatures/fighter/studiedAttacks.mjs';
export { tacticalShift as 'tactical-shift' } from './modern/classFeatures/fighter/tacticalShift.mjs';

/*********************************/
/*             Monk              */
/*********************************/
export { deflectAttacks as 'deflect-attacks' } from './modern/classFeatures/monk/deflectAttacks.mjs';
export { empoweredStrikes as 'empowered-strikes' } from './modern/classFeatures/monk/empoweredStrikes.mjs';
export { heightenedFocus as 'heightened-focus' } from './modern/classFeatures/monk/heightenedFocus.mjs';
export { stunningStrike as 'stunning-strike' } from './modern/classFeatures/monk/stunningStrike.mjs';

/*     Warrior of the Street     */
export { combo, comboEffect } from './modern/classFeatures/monk/warriorOfTheStreet/combo.mjs';

/*********************************/
/*            Paladin            */
/*********************************/

/*         Noble Genies          */
export { auraOfElementalShielding as 'aura-of-elemental-shielding' } from './modern/classFeatures/paladin/nobleGenies/auraOfElementalShielding.mjs';
export { elementalRebuke as 'elemental-rebuke' } from './modern/classFeatures/paladin/nobleGenies/elementalRebuke.mjs';
export { elementalStrike as 'elemental-strike' } from './modern/classFeatures/paladin/nobleGenies/elementalStrike.mjs';
export { nobleScion as 'noble-scion' } from './modern/classFeatures/paladin/nobleGenies/nobleScion.mjs';

/*********************************/
/*            Ranger             */
/*********************************/
export { favoredEnemy as 'favored-enemy' } from './modern/classFeatures/ranger/favoredEnemy.mjs';
export { foeSlayer as 'foe-slayer' } from './modern/classFeatures/ranger/foeSlayer.mjs';
export { preciseHunter as 'precise-hunter' } from './modern/classFeatures/ranger/preciseHunter.mjs';
export { relentlessHunter as 'relentless-hunter' } from './modern/classFeatures/ranger/relentlessHunter.mjs';
export { tireless } from './modern/classFeatures/ranger/tireless.mjs';

/*         Beast Master          */
export { exceptionalTraining as 'exceptional-training' } from './modern/classFeatures/ranger/beastMaster/exceptionalTraining.mjs';
export { bestialFury as 'bestial-fury', primalCompanion as 'primal-companion' } from './modern/classFeatures/ranger/beastMaster/primalCompanion.mjs';
export { shareSpells as 'share-spells' } from './modern/classFeatures/ranger/beastMaster/shareSpells.mjs';

/*         Fey Wanderer          */
export { mistyWanderer as 'misty-wanderer' } from './modern/classFeatures/ranger/feyWanderer/mistyWanderer.mjs';

/*         Gloom Stalker         */
export { dreadAmbusher as 'dread-ambusher' } from './modern/classFeatures/ranger/gloomStalker/dreadAmbusher.mjs';
export { shadowyDodge as 'shadowy-dodge' } from './modern/classFeatures/ranger/gloomStalker/shadowyDodge.mjs';
export { stalkersFlurry as 'stalkers-flurry' } from './modern/classFeatures/ranger/gloomStalker/stalkersFlurry.mjs';

/*********************************/
/*             Rogue             */
/*********************************/
export { improvedCunningStrike as 'improved-cunning-strike' } from './modern/classFeatures/rogue/improvedCunningStrike.mjs';
export { strokeOfLuck as 'stroke-of-luck' } from './modern/classFeatures/rogue/strokeOfLuck.mjs';

/*       Arcane Trickster        */
export { magicalAmbush as 'magical-ambush' } from './modern/classFeatures/rogue/arcaneTrickster/magicalAmbush.mjs';
export { spellThief as 'spell-thief' } from './modern/classFeatures/rogue/arcaneTrickster/spellThief.mjs';
export { versatileTrickster as 'versatile-trickster' } from './modern/classFeatures/rogue/arcaneTrickster/versatileTrickster.mjs';

/*           Assassin            */
export { assassinate } from './modern/classFeatures/rogue/assassin/assassinate.mjs';
export { deathStrike as 'death-strike' } from './modern/classFeatures/rogue/assassin/deathStrike.mjs';
export { envenomWeapons as 'envenom-weapons' } from './modern/classFeatures/rogue/assassin/envenomWeapons.mjs';

/*        Sanguine Thief         */
export { stealBlood as 'steal-blood' } from './modern/classFeatures/rogue/sanguineThief/stealBlood.mjs';
export { stolenPower as 'stolen-power' } from './modern/classFeatures/rogue/sanguineThief/stolenPower.mjs';

/*           Soulknife           */
export { psionicPower as 'psionic-power' } from './modern/classFeatures/rogue/soulknife/psionicPower.mjs';

/*********************************/
/*            Warlock            */
/*********************************/

/*            Archfey            */
export { stepsOfTheFey as 'steps-of-the-fey' } from './modern/classFeatures/warlock/archfey/stepsOfTheFey.mjs';

/*     Eldritch Invocations      */
export { agonizingBlast as 'agonizing-blast' } from './modern/classFeatures/warlock/invocations/agonizingBlast.mjs';
export { pactOfTheBlade as 'pact-of-the-blade', pactOfTheBladeAttack as 'pact-of-the-blade-attack' } from './modern/classFeatures/warlock/invocations/pactOfTheBlade.mjs';
export { pactOfTheChain as 'pact-of-the-chain' } from './modern/classFeatures/warlock/invocations/pactOfTheChain.mjs';

/*            Feline             */
export { felineForm as 'feline-form', felineFormActive as 'feline-form-active', felineFormRevert as 'feline-form-revert' } from './modern/classFeatures/warlock/feline/felineForm.mjs';

/*         Great Old One         */
export { awakenedMind as 'awakened-mind' } from './modern/classFeatures/warlock/greatOldOne/awakenedMind.mjs';
export { createThrall as 'create-thrall', thrallBonus as 'thrall-bonus' } from './modern/classFeatures/warlock/greatOldOne/createThrall.mjs';
export { psychicSpells as 'psychic-spells' } from './modern/classFeatures/warlock/greatOldOne/psychicSpells.mjs';
export { thoughtShield as 'thought-shield' } from './modern/classFeatures/warlock/greatOldOne/thoughtShield.mjs';

/*********************************/
/*            Wizard             */
/*********************************/
export { arcaneRecovery as 'arcane-recovery' } from './modern/classFeatures/wizard/arcaneRecovery.mjs';
export { memorizeSpell as 'memorize-spell' } from './modern/classFeatures/wizard/memorizeSpell.mjs';

/*         Sangromancer          */
export { fullBlooded as 'full-blooded' } from './modern/classFeatures/wizard/sangromancer/fullBlooded.mjs';

/*===============================*/
/*             FEATS             */
/*===============================*/
export { exploitOpening as 'exploit-opening' } from './modern/feats/exploitOpening.mjs';
export { familyFirst as 'family-first' } from './modern/feats/familyFirst.mjs';
export { oldBlessing as 'old-blessing' } from './modern/feats/oldBlessing.mjs';
export { protectionMoved } from './modern/feats/protection.mjs';
export { sangromanticInitiate as 'sangromantic-initiate' } from './modern/feats/sangromanticInitiate.mjs';
export { tirelessReveler as 'tireless-reveler' } from './modern/feats/tirelessReveler.mjs';
export { twistedHex as 'twisted-hex', twistedHexCharm as 'twisted-hex-charm' } from './modern/feats/twistedHex.mjs';

/*===============================*/
/*         MISCELLANEOUS         */
/*===============================*/
export { unarmedStrike as 'unarmed-strike' } from './modern/misc/unarmedStrike.mjs';

/*===============================*/
/*       MONSTER FEATURES        */
/*===============================*/

/*           Construct           */
export { shieldGuardianBound as 'bound|shield-guardian', shieldGuardianBoundBind, shieldGuardianBoundDamage } from './modern/monsters/construct/shieldGuardian/bound.mjs';

/*===============================*/
/*        OTHER FEATURES         */
/*===============================*/
export { sangromancySpecialist as 'stage-3-boon-sangromancy-specialist' } from './modern/otherFeatures/sangromancySpecialist.mjs';

/*         Dark Bargain          */
export { handOfDeath as 'hand-of-death', handOfDeathClingToLife, handOfDeathDeathKnell } from './modern/otherFeatures/darkBargain/handOfDeath.mjs';

/*===============================*/
/*       SPECIES FEATURES        */
/*===============================*/

/*            Dhampir            */
export { vampiricBite as 'vampiric-bite' } from './modern/speciesFeatures/dhampir/vampiricBite.mjs';

/*  Grim Hollow Heritage Traits  */
export { etherealFade as 'ethereal-fade', etherealFadeEnd } from './modern/speciesFeatures/grimHollowHeritageTraits/etherealFade.mjs';
export { extremeResilience as 'extreme-resilience' } from './modern/speciesFeatures/grimHollowHeritageTraits/extremeResilience.mjs';
export { firstStrike as 'first-strike' } from './modern/speciesFeatures/grimHollowHeritageTraits/firstStrike.mjs';
export { powerNap as 'power-nap' } from './modern/speciesFeatures/grimHollowHeritageTraits/powerNap.mjs';
export { restorativeRest as 'restorative-rest' } from './modern/speciesFeatures/grimHollowHeritageTraits/restorativeRest.mjs';

/*           Mandrake            */
export { entanglingVines as 'entangling-vines' } from './modern/speciesFeatures/mandrake/entanglingVines.mjs';
export { rootMagic as 'root-magic' } from './modern/speciesFeatures/mandrake/rootMagic.mjs';

/*            Wulven             */
export { naturalAttackClaws as 'natural-attack-claws' } from './modern/speciesFeatures/wulven/naturalAttack.mjs';
export { packHunter as 'pack-hunter' } from './modern/speciesFeatures/wulven/packHunter.mjs';

/*===============================*/
/*            SPELLS             */
/*===============================*/
export { alterSelf as 'alter-self' } from './modern/spells/alterSelf.mjs';
export { arcaneVigor as 'arcane-vigor' } from './modern/spells/arcaneVigor.mjs';
export { auraOfVitality as 'aura-of-vitality', auraOfVitalityTurn } from './modern/spells/auraOfVitality.mjs';
export { antilifeShell as 'antilife-shell' } from './modern/spells/antilifeShell.mjs';
export { banishingSmite as 'banishing-smite' } from './modern/spells/banishingSmite.mjs';
export { bladeWard as 'blade-ward' } from './modern/spells/bladeWard.mjs';
export { chromaticOrb as 'chromatic-orb' } from './modern/spells/chromaticOrb.mjs';
export { commandEffect as 'command-effect' } from './modern/spells/command.mjs';
export { conjureElementalElement as 'conjure-elemental-element', conjureElementalFree as 'conjure-elemental-free' } from './modern/spells/conjureElemental.mjs';
export { crimsonLash as 'crimson-lash' } from './modern/spells/crimsonLash.mjs';
export { findSteed as 'find-steed', findSteedLifeBond as 'find-steed-life-bond', otherworldlySteedFeyStep as 'otherworldly-steed-fey-step' } from './modern/spells/findSteed.mjs';
export { forestGuard as 'forest-guard' } from './modern/spells/forestGuard.mjs';
export { guidance } from './modern/spells/guidance.mjs';
export { hungerOfHadar as 'hunger-of-hadar' } from './modern/spells/hungerOfHadar.mjs';
export { huntersMark as 'hunters-mark', huntersMarkAttack as 'hunters-mark-attack' } from './modern/spells/huntersMark.mjs';
export { luckyCharm as 'lucky-charm', luckyCharmCaster as 'lucky-charm-caster', luckyCharmObject as 'lucky-charm-object' } from './modern/spells/luckyCharm.mjs';
export { magicWeapon as 'magic-weapon' } from './modern/spells/magicWeapon.mjs';
export { rayOfEnfeeblement as 'ray-of-enfeeblement' } from './modern/spells/rayOfEnfeeblement.mjs';
export { resistance, resistanceEffect as 'resistance-effect' } from './modern/spells/resistance.mjs';
export { sanctumOfTheShepherd as 'sanctum-of-the-shepherd', sanctumOfTheShepherdMarker as 'sanctum-of-the-shepherd-marker' } from './modern/spells/sanctumOfTheShepherd.mjs';
export { shockingGrasp as 'shocking-grasp' } from './modern/spells/shockingGrasp.mjs';
export { spellfireFlare as 'spellfire-flare' } from './modern/spells/spellfireFlare.mjs';
export { sproutFoliage as 'sprout-foliage' } from './modern/spells/sproutFoliage.mjs';
export { summerWinds as 'summer-winds' } from './modern/spells/summerWinds.mjs';
export { wiltingSmite as 'wilting-smite' } from './modern/spells/wiltingSmite.mjs';
