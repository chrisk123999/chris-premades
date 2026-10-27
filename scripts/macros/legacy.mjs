/****************************************************************************/
/*                                2014 RULES                                */
/****************************************************************************/
/* Automations for 2014 rules only. Folder: macros/legacy.                  */
/*                                                                          */
/* Lookups for 2014 items check this file first, then all.mjs.              */
/****************************************************************************/

/*============================*/
/*       CLASS FEATURES       */
/*============================*/

/******************************/
/*         Artificer          */
/******************************/
export { infuseItem as 'infuse-item' } from './legacy/classFeatures/artificer/infuseItem.mjs';
export {
    infusionCollectArmors,
    infusionCollectArmorShield,
    infusionCollectArmorRobes,
    infusionCollectFoci,
    infusionCollectShield,
    infusionCollectWeapons,
    infusionCollectAmmoWeapons,
    infusionCollectThrownWeapons,
    infusionArcanePropulsion as 'infusion-arcane-propulsion-armor',
    infusionArmorOfMagicalStrength as 'infusion-armor-of-magical-strength',
    infusionArmorOfMagicalStrengthProne,
    infusionBootsOfTheWindingPath as 'infusion-boots-of-the-winding-path',
    infusionEnhancedArcaneFocus as 'infusion-enhanced-arcane-focus',
    infusionEnhancedDefense as 'infusion-enhanced-defense',
    infusionEnhancedWeapon as 'infusion-enhanced-weapon',
    infusionHelmOfAwareness as 'infusion-helm-of-awareness',
    infusionHomunculusServant as 'infusion-homunculus-servant',
    infusionHomunculusServantChannel,
    infusionHomunculusServantChannelEarly,
    infusionHomunculusServantCommand,
    infusionHomunculusServantDeath,
    infusionMindSharpener as 'infusion-mind-sharpener',
    infusionRadiantWeapon as 'infusion-radiant-weapon',
    infusionRepeatingShot as 'infusion-repeating-shot',
    infusionRepulsionShield as 'infusion-repulsion-shield',
    infusionResistantArmor as 'infusion-resistant-armor',
    infusionReturningWeapon as 'infusion-returning-weapon',
    infusionSpellRefuelingRing as 'infusion-spell-refueling-ring'
} from './legacy/classFeatures/artificer/infusions.mjs';
export { rightToolForTheJob as 'the-right-tool-for-the-job' } from './legacy/classFeatures/artificer/rightToolForTheJob.mjs';
export { soulOfArtifice as 'soul-of-artifice' } from './legacy/classFeatures/artificer/soulOfArtifice.mjs';

/******************************/
/*         Barbarian          */
/******************************/
export { brutalCritical as 'brutal-critical' } from './legacy/classFeatures/barbarian/brutalCritical.mjs';
export { dangerSense as 'danger-sense' } from './legacy/classFeatures/barbarian/dangerSense.mjs';
export { endRage, keepRage } from './legacy/classFeatures/barbarian/rage.mjs';
export { wildSurge as 'wild-surge', wildSurgeRetribution as 'wild-surge-retribution' } from './legacy/classFeatures/barbarian/pathOfWildMagic/wildSurge.mjs';

/*     Ancestral Guardian     */
export { ancestralProtectors as 'ancestral-protectors', ancestralProtectorsAttack, ancestralProtectorsHinder } from './legacy/classFeatures/barbarian/ancestral/ancestralProtectors.mjs';
export { spiritShield as 'spirit-shield', spiritShieldProtect } from './legacy/classFeatures/barbarian/ancestral/spiritShield.mjs';
export { vengefulAncestors as 'vengeful-ancestors' } from './legacy/classFeatures/barbarian/ancestral/vengefulAncestors.mjs';

/*           Beast            */
export { bestialSoulJump } from './legacy/classFeatures/barbarian/beast/bestialSoul.mjs';
export { callTheHunt as 'call-the-hunt', callTheHuntDamage } from './legacy/classFeatures/barbarian/beast/callTheHunt.mjs';
export { formOfTheBeast as 'form-of-the-beast' } from './legacy/classFeatures/barbarian/beast/formOfTheBeast.mjs';
export { infectiousFury as 'infectious-fury', infectiousFuryAttack } from './legacy/classFeatures/barbarian/beast/infectiousFury.mjs';

/*         Berserker          */
export { frenzy, frenzyRageEnd } from './legacy/classFeatures/barbarian/berserker/frenzy.mjs';
export { intimidatingPresence as 'intimidating-presence', extendIntimidatingPresence, immuneIntimidatingPresence } from './legacy/classFeatures/barbarian/berserker/intimidatingPresence.mjs';

/*        Totem Warrior       */
export { bearAspect as 'aspect-of-the-beast-bear' } from './legacy/classFeatures/barbarian/totem/bearAspect.mjs';
export { bearAttunement as 'totemic-attunement-bear', bearAttack, eagleAttunement as 'totemic-attunement-eagle' } from './legacy/classFeatures/barbarian/totem/totemicAttunement.mjs';
export { bearTotem as 'totem-spirit-bear', eagleTotem as 'totem-spirit-eagle', tigerTotem as 'totem-spirit-tiger', tigerJump } from './legacy/classFeatures/barbarian/totem/totemSpirit.mjs';

/******************************/
/*            Bard            */
/******************************/
export { countercharm } from './legacy/classFeatures/bard/countercharm.mjs';
export { magicalInspiration as 'magical-inspiration', magicalInspirationEffect } from './legacy/classFeatures/bard/magicalInspiration.mjs';

/******************************/
/*           Cleric           */
/******************************/
export { channelDivinity as 'channel-divinity|class:cleric', turnUndead } from './legacy/classFeatures/cleric/channelDivinity.mjs';
export { destroyUndead as 'destroy-undead' } from './legacy/classFeatures/cleric/destroyUndead.mjs';
export { divineStrike as 'divine-strike' } from './legacy/classFeatures/cleric/divineStrike.mjs';
export { harnessDivinePower as 'harness-divine-power' } from './legacy/classFeatures/cleric/harnessDivinePower.mjs';

/******************************/
/*           Druid            */
/******************************/
export { spiritTotem as 'spirit-totem', spiritTotemDetect as 'spirit-totem-detect' } from './legacy/classFeatures/druid/circleOfTheShepherd/spiritTotem.mjs';
export { wildShape as 'wild-shape', wildShapeActive } from './legacy/classFeatures/druid/wildShape.mjs';

/******************************/
/*          Fighter           */
/******************************/
export { echoAvatar as 'echo-avatar', legionOfOne as 'legion-of-one', manifestEcho as 'manifest-echo', unleashIncarnation as 'unleash-incarnation' } from './legacy/classFeatures/fighter/echoKnight/manifestEcho.mjs';

/******************************/
/*            Monk            */
/******************************/
export { dedicatedWeapon as 'dedicated-weapon' } from './legacy/classFeatures/monk/dedicatedWeapon.mjs';
export { focusedAim as 'focused-aim' } from './legacy/classFeatures/monk/focusedAim.mjs';
export { stunningStrike as 'stunning-strike' } from './legacy/classFeatures/monk/stunningStrike.mjs';

/******************************/
/*          Paladin           */
/******************************/
export { divineSmite as 'divine-smite' } from './legacy/classFeatures/paladin/divineSmite.mjs';

/*      Oath of Devotion      */
export { holyNimbus as 'holy-nimbus' } from './legacy/classFeatures/paladin/oathOfDevotion/holyNimbus.mjs';
export { sacredWeapon as 'channel-divinity-sacred-weapon' } from './legacy/classFeatures/paladin/oathOfDevotion/sacredWeapon.mjs';

/*       Oath of Glory        */
export { inspiringSmite as 'channel-divinity-inspiring-smite' } from './legacy/classFeatures/paladin/oathOfGlory/inspiringSmite.mjs';

/*        Oathbreaker         */
export { controlUndead as 'channel-divinity-control-undead' } from './legacy/classFeatures/paladin/oathbreaker/controlUndead.mjs';
export { dreadLord as 'dread-lord', dreadLordShadow as 'dread-lord-shadow' } from './legacy/classFeatures/paladin/oathbreaker/dreadLord.mjs';

/******************************/
/*           Ranger           */
/******************************/
export { favoredFoe as 'favored-foe' } from './legacy/classFeatures/ranger/favoredFoe.mjs';

/*        Beast Master        */
export { exceptionalTraining as 'exceptional-training' } from './legacy/classFeatures/ranger/beastMaster/exceptionalTraining.mjs';
export { primalCompanion as 'primal-companion' } from './legacy/classFeatures/ranger/beastMaster/primalCompanion.mjs';

/*        Drakewarden         */
export { drakeCompanionInfuse as 'drake-companion-infused-strikes', drakeCompanionResistance as 'drake-companion-resistance', drakeCompanionSummon as 'drake-companion-summon' } from './legacy/classFeatures/ranger/drakewarden/drakeCompanion.mjs';

/*       Gloom Stalker        */
export { dreadAmbusher as 'dread-ambusher' } from './legacy/classFeatures/ranger/gloomStalker/dreadAmbusher.mjs';

/******************************/
/*           Rogue            */
/******************************/

/*        Inquisitive         */
export { eyeForWeakness as 'eye-for-weakness' } from './legacy/classFeatures/rogue/inquisitive/eyeForWeakness.mjs';
export { insightfulFighting as 'insightful-fighting' } from './legacy/classFeatures/rogue/inquisitive/insightfulFighting.mjs';

/*         Mastermind         */
export { insightfulManipulator as 'insightful-manipulator' } from './legacy/classFeatures/rogue/mastermind/insightfulManipulator.mjs';

/*          Phantom           */
export { deathsFriend as 'deaths-friend' } from './legacy/classFeatures/rogue/phantom/deathsFriend.mjs';
export { wailsFromTheGrave as 'wails-from-the-grave' } from './legacy/classFeatures/rogue/phantom/wailsFromTheGrave.mjs';

/*         Soulknife          */
export { psionicEnergy as 'psionic-energy' } from './legacy/classFeatures/rogue/soulknife/psionicEnergy.mjs';

/*        Swashbuckler        */
export { rakishAudacity as 'rakish-audacity' } from './legacy/classFeatures/rogue/swashbuckler/rakishAudacity.mjs';

/******************************/
/*          Sorcerer          */
/******************************/
export { carefulSpell as 'careful-spell', carefulSpellEffect as 'careful-spell-effect', distantSpell as 'distant-spell', empoweredSpell as 'empowered-spell', extendedSpell as 'extended-spell', heightenedSpell as 'heightened-spell', heightenedSpellEffect as 'heightened-spell-effect', quickenedSpell as 'quickened-spell', seekingSpell as 'seeking-spell', subtleSpell as 'subtle-spell', transmutedSpell as 'transmuted-spell', twinnedSpell as 'twinned-spell', twinnedSpellCast as 'twinned-spell-cast' } from './legacy/classFeatures/sorcerer/metamagic.mjs';

/*       Aberrant Mind        */
export { psionicSorcery as 'psionic-sorcery' } from './legacy/classFeatures/sorcerer/aberrantMind/psionicSorcery.mjs';
export { psionicSpells as 'psionic-spells' } from './legacy/classFeatures/sorcerer/aberrantMind/psionicSpells.mjs';
export { revelationInFlesh as 'revelation-in-flesh' } from './legacy/classFeatures/sorcerer/aberrantMind/revelationInFlesh.mjs';
export { telepathicSpeech as 'telepathic-speech' } from './legacy/classFeatures/sorcerer/aberrantMind/telepathicSpeech.mjs';
export { warpingImplosion as 'warping-implosion' } from './legacy/classFeatures/sorcerer/aberrantMind/warpingImplosion.mjs';

/*        Divine Soul         */
export { favoredByTheGods as 'favored-by-the-gods' } from './legacy/classFeatures/sorcerer/divineSoul/favoredByTheGods.mjs';

/*        Shadow Magic        */
export { houndOfIllOmen as 'hound-of-ill-omen' } from './legacy/classFeatures/sorcerer/shadowMagic/houndOfIllOmen.mjs';
export { umbralForm as 'umbral-form', umbralFormDismiss as 'umbral-form-dismiss' } from './legacy/classFeatures/sorcerer/shadowMagic/umbralForm.mjs';

/*       Storm Sorcery        */
export { heartOfTheStorm as 'heart-of-the-storm' } from './legacy/classFeatures/sorcerer/stormSorcery/heartOfTheStorm.mjs';

/******************************/
/*          Warlock           */
/******************************/

/*          Archfey           */
export { feyPresence as 'fey-presence' } from './legacy/classFeatures/warlock/archfey/feyPresence.mjs';
export { mistyEscape as 'misty-escape' } from './legacy/classFeatures/warlock/archfey/mistyEscape.mjs';

/*    Eldritch Invocations    */
export { eldritchSmite as 'eldritch-smite' } from './legacy/classFeatures/warlock/invocations/eldritchSmite.mjs';
export { giftOfTheProtectors as 'gift-of-the-protectors', giftOfTheProtectorsProtected as 'gift-of-the-protectors-protected' } from './legacy/classFeatures/warlock/invocations/giftOfTheProtectors.mjs';
export { graspOfHadar as 'grasp-of-hadar' } from './legacy/classFeatures/warlock/invocations/graspOfHadar.mjs';
export { investmentOfTheChainMaster as 'investment-of-the-chain-master', investmentOfTheChainMasterResistance as 'investment-of-the-chain-master-resistance' } from './legacy/classFeatures/warlock/invocations/investmentOfTheChainMaster.mjs';
export { lanceOfLethargy as 'lance-of-lethargy' } from './legacy/classFeatures/warlock/invocations/lanceOfLethargy.mjs';
export { maddeningHex as 'maddening-hex' } from './legacy/classFeatures/warlock/invocations/maddeningHex.mjs';
export { relentlessHex as 'relentless-hex' } from './legacy/classFeatures/warlock/invocations/relentlessHex.mjs';
export { repellingBlast as 'repelling-blast' } from './legacy/classFeatures/warlock/invocations/repellingBlast.mjs';

/*         Fathomless         */
export { tentacleOfTheDeeps as 'tentacle-of-the-deeps' } from './legacy/classFeatures/warlock/fathomless/tentacleOfTheDeeps.mjs';

/*           Fiend            */
export { darkOnesBlessing as 'dark-ones-blessing' } from './legacy/classFeatures/warlock/fiend/darkOnesBlessing.mjs';

/*          Hexblade          */
export { hexbladesCurse as 'hexblades-curse', hexbladesCurseSource as 'hexblades-curse-source', hexbladesCurseTarget as 'hexblades-curse-target' } from './legacy/classFeatures/warlock/hexblade/hexbladesCurse.mjs';
export { hexWarrior as 'hex-warrior' } from './legacy/classFeatures/warlock/hexblade/hexWarrior.mjs';

/*         Pact Boons         */
export { createPactWeapon as 'create-pact-weapon' } from './legacy/classFeatures/warlock/boons/createPactWeapon.mjs';

/*          Predator          */
export { formOfTheBeastWarlock as 'form-of-the-beast-warlock', formOfTheBeastWarlockEffect as 'form-of-the-beast-warlock-effect' } from './legacy/classFeatures/warlock/predator/formOfTheBeast.mjs';

/*           Undead           */
export { formOfDread as 'form-of-dread', formOfDreadActive as 'form-of-dread-active' } from './legacy/classFeatures/warlock/undead/formOfDread.mjs';
export { graveTouched as 'grave-touched' } from './legacy/classFeatures/warlock/undead/graveTouched.mjs';

/******************************/
/*           Wizard           */
/******************************/

/*        Bladesinging        */
export { bladesong as 'bladesong' } from './legacy/classFeatures/wizard/bladeSinging/bladesong.mjs';
export { songOfDefense as 'song-of-defense' } from './legacy/classFeatures/wizard/bladeSinging/songOfDefense.mjs';

/*      Chronurgy Magic       */
export { chronalShift as 'chronal-shift' } from './legacy/classFeatures/wizard/chronurgyMagic/chronalShift.mjs';

/*      Graviturgy Magic      */
export { adjustDensity as 'adjust-density' } from './legacy/classFeatures/wizard/graviturgyMagic/adjustDensity.mjs';
export { gravityWell as 'gravity-well' } from './legacy/classFeatures/wizard/graviturgyMagic/gravityWell.mjs';

/*       Leyline Magic        */
export { naturalAttunement as 'natural-attunement', naturalAttunementEffect as 'natural-attunement-effect' } from './legacy/classFeatures/wizard/leylineMagic/naturalAttunement.mjs';
export { thrumOfTheLand as 'thrum-of-the-land' } from './legacy/classFeatures/wizard/leylineMagic/thrumOfTheLand.mjs';

/*      Order of Scribes      */
export { awakenedSpellbook as 'awakened-spellbook' } from './legacy/classFeatures/wizard/orderOfScribes/awakenedSpellbook.mjs';
export { manifestMind as 'manifest-mind', manifestMindCast as 'manifest-mind-cast' } from './legacy/classFeatures/wizard/orderOfScribes/manifestMind.mjs';

/*    School of Abjuration    */
export { arcaneWard as 'arcane-ward' } from './legacy/classFeatures/wizard/schoolOfAbjuration/arcaneWard.mjs';
export { projectedWard as 'projected-ward' } from './legacy/classFeatures/wizard/schoolOfAbjuration/projectedWard.mjs';

/*    School of Divination    */
export { expertDivination as 'expert-divination' } from './legacy/classFeatures/wizard/schoolOfDivination/expertDivination.mjs';

/*    School of Evocation     */
export { overchannel as 'overchannel' } from './legacy/classFeatures/wizard/schoolOfEvocation/overchannel.mjs';
export { sculptSpells as 'sculpt-spells' } from './legacy/classFeatures/wizard/schoolOfEvocation/sculptSpells.mjs';

/*    School of Necromancy    */
export { grimHarvest as 'grim-harvest' } from './legacy/classFeatures/wizard/schoolOfNecromancy/grimHarvest.mjs';
export { undeadThralls as 'undead-thralls' } from './legacy/classFeatures/wizard/schoolOfNecromancy/undeadThralls.mjs';

/*         War Magic          */
export { durableMagic as 'durable-magic' } from './legacy/classFeatures/wizard/warMagic/durableMagic.mjs';

/*============================*/
/*         EQUIPMENT          */
/*============================*/
export { amuletOfTheLycanthrope as 'amulet-of-the-lycanthrope', amuletOfTheLycanthropeEffect as 'amulet-of-the-lycanthrope-effect' } from './legacy/equipment/amuletOfTheLycanthrope.mjs';
export { dancingSword as 'dancing-sword' } from './legacy/equipment/dancingSword.mjs';
export { harkonsBite as 'harkons-bite', harkonsBiteEffect as 'harkons-bite-effect' } from './legacy/equipment/harkonsBite.mjs';

/*============================*/
/*           SPELLS           */
/*============================*/
export { absorbElements as 'absorb-elements' } from './legacy/spells/absorbElements.mjs';
export { animateObjects as 'animate-objects' } from './legacy/spells/animateObjects.mjs';
export { antagonize } from './legacy/spells/antagonize.mjs';
export { bigbysHand as 'bigbys-hand', bigbysHandInterposed as 'bigbys-hand-interposed' } from './legacy/spells/bigbysHand.mjs';
export { boomingBladeMoved as 'booming-blade-moved' } from './legacy/spells/boomingBlade.mjs';
export { chaosBolt as 'chaos-bolt' } from './legacy/spells/chaosBolt.mjs';
export { chillTouch as 'chill-touch', chillTouchUndead as 'chill-touch-undead' } from './legacy/spells/chillTouch.mjs';
export { dawn } from './legacy/spells/dawn.mjs';
export { findGreaterSteed as 'find-greater-steed', findSteed as 'find-steed', findSteedActive as 'find-steed-active', findSteedDismiss as 'find-steed-dismiss' } from './legacy/spells/findSteed.mjs';
export { flockOfFamiliars as 'flock-of-familiars' } from './legacy/spells/flockOfFamiliars.mjs';
export { healingSpiritHeal as 'healing-spirit-heal' } from './legacy/spells/healingSpirit.mjs';
export { holyWeapon as 'holy-weapon' } from './legacy/spells/holyWeapon.mjs';
export { huntersMark as 'hunters-mark', huntersMarkAttack as 'hunters-mark-attack' } from './legacy/spells/huntersMark.mjs';
export { lifeTransference as 'life-transference' } from './legacy/spells/lifeTransference.mjs';
export { lightningLure as 'lightning-lure' } from './legacy/spells/lightningLure.mjs';
export { maximiliansEarthenGrasp as 'maximilians-earthen-grasp' } from './legacy/spells/maximiliansEarthenGrasp.mjs';
export { rayOfEnfeeblement as 'ray-of-enfeeblement', rayOfEnfeeblementEnfeebled as 'ray-of-enfeeblement-enfeebled' } from './legacy/spells/rayOfEnfeeblement.mjs';
export { shadowBlade as 'shadow-blade', shadowBladeSword as 'shadow-blade-sword' } from './legacy/spells/shadowBlade.mjs';
export { shockingGrasp as 'shocking-grasp' } from './legacy/spells/shockingGrasp.mjs';
export { sickeningRadiance as 'sickening-radiance', sickeningRadianceSickened } from './legacy/spells/sickeningRadiance.mjs';
export { spiritOfDeathHaunt as 'spirit-of-death-haunt', spiritOfDeathHaunted as 'spirit-of-death-haunted', spiritOfDeathScythe as 'spirit-of-death-scythe' } from './legacy/spells/spiritOfDeath.mjs';
export { stormSphere as 'storm-sphere' } from './legacy/spells/stormSphere.mjs';
export { tashasCausticBrew as 'tashas-caustic-brew' } from './legacy/spells/tashasCausticBrew.mjs';
export { witherAndBloom as 'wither-and-bloom' } from './legacy/spells/witherAndBloom.mjs';
