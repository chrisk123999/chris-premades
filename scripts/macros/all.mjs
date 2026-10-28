/****************************************************************************/
/*                                ALL RULES                                 */
/****************************************************************************/
/* Automations built for both 2014 and 2024 rules.                          */
/*                                                                          */
/* Rule-specific lookups fall back to this file when legacy or modern       */
/* has no match.                                                            */
/****************************************************************************/

/*============================*/
/*          ACTIONS           */
/*============================*/
export { fall } from './all/actions/fall.mjs';
export { help, helpAlly } from './all/actions/help.mjs';
export { jump, longJump } from './all/actions/jump.mjs';

/*============================*/
/*       CLASS FEATURES       */
/*============================*/

/******************************/
/*         Artificer          */
/******************************/
export { flashOfGenius as 'flash-of-genius' } from './all/classFeatures/artificer/flashOfGenius.mjs';
export { spellStoringItem as 'spell-storing-item' } from './all/classFeatures/artificer/spellStoring.mjs';
export { swapArtificerPlan, useArtificerPlan, fromPlanSwapArtificerPlan, fromPlanCreateArtificerPlan, infusionPrechecks } from './all/classFeatures/artificer/useOrSwapPlan.mjs';

/******************************/
/*         Barbarian          */
/******************************/
export { indomitableMight as 'indomitable-might' } from './all/classFeatures/barbarian/indomitableMight.mjs';
export { instinctivePounce as 'instinctive-pounce' } from './all/classFeatures/barbarian/instinctivePounce.mjs';
export { persistentRage as 'persistent-rage' } from './all/classFeatures/barbarian/persistentRage.mjs';
export { rage, raging } from './all/classFeatures/barbarian/rage.mjs';
export { relentlessRage as 'relentless-rage' } from './all/classFeatures/barbarian/relentlessRage.mjs';

/*          Berserker         */
export { mindlessRage as 'mindless-rage' } from './all/classFeatures/barbarian/berserker/mindlessRage.mjs';
export { retaliation } from './all/classFeatures/barbarian/berserker/retaliation.mjs';

/*           Zealot           */
export { divineFury as 'divine-fury', divineFuryDamage } from './all/classFeatures/barbarian/zealot/divineFury.mjs';
export { fanaticalFocus as 'fanatical-focus' } from './all/classFeatures/barbarian/zealot/fanaticalFocus.mjs';
export { zealousPresence as 'zealous-presence' } from './all/classFeatures/barbarian/zealot/zealousPresence.mjs';

/******************************/
/*            Bard            */
/******************************/
export { bardicInspiration as 'bardic-inspiration', bardicInspirationEffect } from './all/classFeatures/bard/bardicInspiration.mjs';

/******************************/
/*           Druid            */
/******************************/
export { beastSpells as 'beast-spells' } from './all/classFeatures/druid/beastSpells.mjs';
export { wildShape as 'wild-shape', wildShapeChooseForms, wildShapeRevert } from './all/classFeatures/druid/wildShape.mjs';

/******************************/
/*          Fighter           */
/******************************/
export { indomitable } from './all/classFeatures/fighter/indomitable.mjs';

/******************************/
/*            Monk            */
/******************************/
export { stepOfTheWindJump } from './all/classFeatures/monk/flurryOfBlows.mjs';
export { slowFall as 'slow-fall' } from './all/classFeatures/monk/slowFall.mjs';

/******************************/
/*          Paladin           */
/******************************/
export { layOnHands as 'lay-on-hands' } from './all/classFeatures/paladin/layOnHands.mjs';

/******************************/
/*           Ranger           */
/******************************/

/*        Fey Wanderer        */
export { beguilingTwist as 'beguiling-twist' } from './all/classFeatures/ranger/feyWanderer/beguilingTwist.mjs';
export { dreadfulStrikes as 'dreadful-strikes' } from './all/classFeatures/ranger/feyWanderer/dreadfulStrikes.mjs';

/*       Gloom Stalker        */
export { umbralSight as 'umbral-sight' } from './all/classFeatures/ranger/gloomStalker/umbralSight.mjs';

/******************************/
/*           Rogue            */
/******************************/
export { sneakAttack as 'sneak-attack' } from './all/classFeatures/rogue/sneakAttack.mjs';
export { steadyAim as 'steady-aim' } from './all/classFeatures/rogue/steadyAim.mjs';

/*         Soulknife          */
export { psychicBlades as 'psychic-blades' } from './all/classFeatures/rogue/soulknife/psychicBlades.mjs';

/******************************/
/*          Warlock           */
/******************************/

/*    Eldritch Invocations    */
export { oneWithShadows as 'one-with-shadows' } from './all/classFeatures/warlock/invocations/oneWithShadows.mjs';

/*============================*/
/*         EQUIPMENT          */
/*============================*/
export { arcaneGrimoire as 'arcane-grimoire-1', arcaneGrimoire as 'arcane-grimoire-2', arcaneGrimoire as 'arcane-grimoire-3' } from './all/equipment/arcaneGrimoire.mjs';
export { mindSharpener as 'mind-sharpener' } from './all/equipment/mindSharpener.mjs';
export { repulsionShield as 'repulsion-shield' } from './all/equipment/repulsionShield.mjs';
export { spellRefuelingRing as 'spell-refueling-ring' } from './all/equipment/spellRefuelingRing.mjs';

/*============================*/
/*           FEATS            */
/*============================*/
export { preciseStrike as 'precise-strike' } from './all/feats/preciseStrike.mjs';

/*============================*/
/*      FIGHTING STYLES       */
/*============================*/
export { dueling, dueling as 'fighting-style-dueling' } from './all/fightingStyles/dueling.mjs';
export { greatWeaponFighting as 'fighting-style-great-weapon-fighting', greatWeaponFighting as 'great-weapon-fighting' } from './all/fightingStyles/greatWeaponFighting.mjs';
export { interception as 'fighting-style-interception', interception } from './all/fightingStyles/interception.mjs';
export { protection } from './all/fightingStyles/protection.mjs';
export { unarmedFighting } from './all/fightingStyles/unarmedFighting.mjs';

/*============================*/
/*      SPECIES FEATURES      */
/*============================*/

/******************************/
/*          Plasmoid          */
/******************************/
export { amorphous } from './all/speciesFeatures/plasmoid/amorphous.mjs';

/*============================*/
/*           SPELLS           */
/*============================*/
export { acidArrow as 'acid-arrow' } from './all/spells/acidArrow.mjs';
export { animateDead as 'animate-dead', animateDeadEffectDeleted as 'animate-dead-effect-deleted', animateDeadPlace as 'animate-dead-place', animateDeadReassert as 'animate-dead-reassert', animateDeadRecall as 'animate-dead-recall', animateDeadSummon as 'animate-dead-summon' } from './all/spells/animateDead.mjs';
export { armsOfHadar as 'arms-of-hadar' } from './all/spells/armsOfHadar.mjs';
export { banishment } from './all/spells/banishment.mjs';
export { bestowCurse as 'bestow-curse', bestowCurseAttack as 'bestow-curse-attack' } from './all/spells/bestowCurse.mjs';
export { beaconOfHope as 'beacon-of-hope' } from './all/spells/beaconOfHope.mjs';
export { blight } from './all/spells/blight.mjs';
export { blink, blinkAway } from './all/spells/blink.mjs';
export { callLightning as 'call-lightning' } from './all/spells/callLightning.mjs';
export { chainLightning as 'chain-lightning' } from './all/spells/chainLightning.mjs';
export { charmPerson as 'charm-person' } from './all/spells/charmPerson.mjs';
export { cloudkill } from './all/spells/cloudkill.mjs';
export { compelledDuel as 'compelled-duel', compelledDuelSource as 'compelled-duel-source', compelledDuelTarget as 'compelled-duel-target' } from './all/spells/compelledDuel.mjs';
export { darkness as 'darkness' } from './all/spells/darkness.mjs';
export { deathWard as 'death-ward' } from './all/spells/deathWard.mjs';
export { disintegrate } from './all/spells/disintegrate.mjs';
export { dragonsBreath as 'dragons-breath' } from './all/spells/dragonsBreath.mjs';
export { enlargeReduce as 'enlarge-reduce', enlargeReduceEffect as 'enlarge-reduce-effect' } from './all/spells/enlargeReduce.mjs';
export { findFamiliar as 'find-familiar', findFamiliarPocket as 'find-familiar-pocket', findFamiliarTouch as 'find-familiar-touch', findFamiliarTouchEffect as 'find-familiar-touch-effect' } from './all/spells/findFamiliar.mjs';
export { fireShield as 'fire-shield' } from './all/spells/fireShield.mjs';
export { fireStorm as 'fire-storm' } from './all/spells/fireStorm.mjs';
export { fogCloud as 'fog-cloud' } from './all/spells/fogCloud.mjs';
export { globeOfInvulnerability as 'globe-of-invulnerability' } from './all/spells/globeOfInvulnerability.mjs';
export { gustOfWind as 'gust-of-wind' } from './all/spells/gustOfWind.mjs';
export { hailOfThorns as 'hail-of-thorns' } from './all/spells/hailOfThorns.mjs';
export { guardianOfFaith as 'guardian-of-faith' } from './all/spells/guardianOfFaith.mjs';
export { heatMetal as 'heat-metal' } from './all/spells/heatMetal.mjs';
export { heroism, heroismEffect as 'heroism-effect' } from './all/spells/heroism.mjs';
export { hex, hexAttack as 'hex-attack' } from './all/spells/hex.mjs';
export { iceKnife as 'ice-knife' } from './all/spells/iceKnife.mjs';
export { iceStorm as 'ice-storm' } from './all/spells/iceStorm.mjs';
export { lightningArrow as 'lightning-arrow' } from './all/spells/lightningArrow.mjs';
export { mirrorImage as 'mirror-image' } from './all/spells/mirrorImage.mjs';
export { moonbeam as 'moonbeam', moonbeamShapechanger as 'moonbeam-shapechanger' } from './all/spells/moonbeam.mjs';
export { protectionFromEvilAndGood as 'protection-from-evil-and-good' } from './all/spells/protectionFromEvilAndGood.mjs';
export { sanctuary } from './all/spells/sanctuary.mjs';
export { sleetStorm as 'sleet-storm' } from './all/spells/sleetStorm.mjs';
export { spiritualWeapon as 'spiritual-weapon' } from './all/spells/spiritualWeapon.mjs';
export { summonCelestialMace as 'summon-celestial-mace' } from './all/spells/summonCelestial.mjs';
export { summonDraconicSpirit as 'summon-draconic-spirit' } from './all/spells/summonDraconicSpirit.mjs';
export { summonFiend as 'summon-fiend' } from './all/spells/summonFiend.mjs';
export { summonFey as 'summon-fey', summonFeyFeyStep as 'fey-step' } from './all/spells/summonFey.mjs';
export { summonUndeadRottingClaw as 'summon-undead-rotting-claw' } from './all/spells/summonUndead.mjs';
export { tollTheDead as 'toll-the-dead' } from './all/spells/tollTheDead.mjs';
export { vampiricTouch as 'vampiric-touch' } from './all/spells/vampiricTouch.mjs';
export { wallOfFire as 'wall-of-fire' } from './all/spells/wallOfFire.mjs';
export { windWall as 'wind-wall' } from './all/spells/windWall.mjs';
export { wallOfSand as 'wall-of-sand' } from './all/spells/wallOfSand.mjs';
export { wallOfWater as 'wall-of-water' } from './all/spells/wallOfWater.mjs';
export { wallOfSnow as 'wall-of-snow' } from './all/spells/wallOfSnow.mjs';
export { wallOfDeath as 'wall-of-death' } from './all/spells/wallOfDeath.mjs';
export { wallOfForce as 'wall-of-force' } from './all/spells/wallOfForce.mjs';
export { wallOfLight as 'wall-of-light' } from './all/spells/wallOfLight.mjs';
export { wallOfStone as 'wall-of-stone' } from './all/spells/wallOfStone.mjs';
export { wallOfIce as 'wall-of-ice' } from './all/spells/wallOfIce.mjs';
export { wallOfThorns as 'wall-of-thorns' } from './all/spells/wallOfThorns.mjs';
export { wallOfGloom as 'wall-of-gloom' } from './all/spells/wallOfGloom.mjs';
export { prismaticWall as 'prismatic-wall' } from './all/spells/prismaticWall.mjs';
export { wardingBond as 'warding-bond', wardingBondSource as 'warding-bond-source', wardingBondTarget as 'warding-bond-target' } from './all/spells/wardingBond.mjs';
