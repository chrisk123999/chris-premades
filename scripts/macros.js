import {armorModel} from './macros/classFeatures/artificer/armorer/armorModel.js';
import {armorOfAgathys} from './macros/spells/armorOfAgathys/armorOfAgathys.js';
import {balmOfPeace} from './macros/classFeatures/cleric/peaceDomain/balmOfPeace.js';
import {bardicInspiration} from './macros/classFeatures/bard/magicalInspiration/magicalInspiration.js'
import {bladeFlourish} from './macros/classFeatures/bard/collegeOfSwords/bladeFlourish.js'
import {blink} from './macros/spells/blink/blink.js';
import {brandOfCastigation} from './macros/classFeatures/bloodHunter/brandOfCastigation/brandOfCastigation.js';
import {bulette} from './macros/monsterFeatures/bulette/bulette.js';
import {callLightning} from './macros/spells/callLightning/callLightning.js';
import {chainLightning} from './macros/spells/chainLightning/chainLightning.js';
import {charmPerson} from './macros/spells/charmPerson/charmPerson.js';
import {chasme} from './macros/monsterFeatures/chasme/chasme.js';
import {chillTouch} from './macros/spells/chillTouch/chillTouch.js';
import {clayGolem} from './macros/monsterFeatures/clayGolem/clayGolem.js';
import {cleave} from './macros/mechanics/cleave/cleave.js';
import {cloudkill} from './macros/spells/cloudkill/cloudkill.js';
import {conditionResistanceEarly, conditionResistanceLate} from './macros/mechanics/conditionResistance/conditionResistance.js';
import {conditionVulnerabilityEarly, conditionVulnerabilityLate} from './macros/mechanics/conditionVulnerability/conditionVulnerability.js';
import {crimsonRite} from './macros/classFeatures/bloodHunter/crimsonRite/crimsonRite.js';
import {darkOnesBlessing} from './macros/classFeatures/warlock/fiend/darkOnesBlessing.js';
import {darkness} from './macros/spells/darkness/darkness.js';
import {deathWard} from './macros/spells/deathWard/deathWard.js';
import {destructiveWrath} from './macros/classFeatures/cleric/tempestDomain/destructiveWrath.js';
import {detectThoughts} from './macros/spells/detectThoughts/detectThoughts.js';
import {divineSmite} from './macros/classFeatures/paladin/divineSmite.js';
import {dragonsBreath} from './macros/spells/dragonsBreath/dragonsBreath.js';
import {dreadAmbusher} from './macros/classFeatures/ranger/gloomStalker/dreadAmbusher.js';
import {experimentalElixir} from './macros/classFeatures/artificer/alchemist/experimentalElixir.js'
import {expertDivination} from './macros/classFeatures/wizard/schoolOfDivination/expertDivination.js';
import {fallenPuppet} from './macros/classFeatures/bloodHunter/bloodCurses/fallenPuppet.js';
import {focusedAim} from './macros/classFeatures/monk/focusedAim.js';
import {formOfDread} from './macros/classFeatures/warlock/undead/formOfDread.js';
import {graveTouched} from './macros/classFeatures/warlock/undead/graveTouched.js';
import {healingLight} from './macros/classFeatures/warlock/celestial/healingLight.js';
import {heartOfTheStorm} from './macros/classFeatures/sorcerer/stormSorcery/heartOfTheStorm.js';
import {hex} from './macros/spells/hex/hex.js';
import {holyWeapon} from './macros/spells/holyWeapon/holyWeapon.js';
import {hybridTransformation} from './macros/classFeatures/bloodHunter/orderOfTheLycan/hybridTransformation.js';
import {lightningArrow} from './macros/spells/lightningArrow/lightningArrow.js';
import {massCureWounds} from './macros/spells/massCureWounds/massCureWounds.js';
import {mirrorImage} from './macros/spells/mirrorImage/mirrorImage.js';
import {muddledMind} from './macros/classFeatures/bloodHunter/bloodCurses/muddledMind.js';
import {protectionFromEvilAndGood} from './macros/spells/protectionFromEvilAndGood/protectionFromEvilAndGood.js';
import {radiantSoul} from './macros/classFeatures/warlock/celestial/radiantSoul.js';
import {reaper} from './macros/classFeatures/cleric/deathDomain/reaper.js';
import {ringOfSpellStoring} from './macros/items/ringOfSpellStoring.js';
import {riteOfTheDawn} from './macros/classFeatures/bloodHunter/orderOfTheGhostslayer/riteOfTheDawn.js';
import {sanctuary} from './macros/spells/sanctuary/sanctuary.js';
import {shadowBlade} from './macros/spells/shadowBlade/shadowBlade.js';
import {shockingGrasp} from './macros/spells/shockingGrasp/shockingGrasp.js';
import {spikeGrowth} from './macros/spells/spikeGrowth/spikeGrowth.js';
import {spiritShroud} from './macros/spells/spiritShroud/spiritShroud.js';
import {stillnessOfMind} from './macros/classFeatures/monk/stillnessOfMind.js';
import {vampiricBite} from './macros/raceFeatures/dhampir/vampiricBite.js';
import {vampiricTouch} from './macros/spells/vampiricTouch/vampiricTouch.js';
import {wildhunt} from './macros/raceFeatures/shifter/wildhunt.js';
import {witherAndBloom} from './macros/spells/witherAndBloom/witherAndBloom.js';
import {wrathOfTheStorm} from './macros/classFeatures/cleric/tempestDomain/wrathOfTheStorm.js';
let monster = {
	'bulette': bulette,
	'chasme': chasme,
	'clayGolem': clayGolem
}
export let macros = {
	'actorOnUse': useActorOnUse,
	'actorOnUseMulti': actorOnUseMulti,
	'armorModel': armorModel,
	'armorOfAgathys': armorOfAgathys,
	'balmOfPeace': balmOfPeace,
	'bardicInspiration': bardicInspiration,
	'bladeFlourish': bladeFlourish,
	'blink': blink,
	'brandOfCastigation': brandOfCastigation,
	'callLightning': callLightning,
	'chainLightning': chainLightning,
	'charmPerson': charmPerson,
	'cleave': cleave,
	'cloudkill': cloudkill,
	'conditionResistanceEarly': conditionResistanceEarly,
	'conditionResistanceLate': conditionResistanceLate,
	'conditionVulnerabilityEarly': conditionVulnerabilityEarly,
	'conditionVulnerabilityLate': conditionVulnerabilityLate,
	'crimsonRite': crimsonRite,
	'darkOnesBlessing': darkOnesBlessing,
	'darkness': darkness,
	'deathWard': deathWard,
	'destructiveWrath': destructiveWrath,
	'detectThoughts': detectThoughts,
	'divineSmite': divineSmite,
	'dragonsBreath': dragonsBreath,
	'dreadAmbusher': dreadAmbusher,
	'experimentalElixir': experimentalElixir,
	'expertDivination': expertDivination,
	'fallenPuppet': fallenPuppet,
	'focusedAim': focusedAim,
	'formOfDread': formOfDread,
	'graveTouched': graveTouched,
	'healingLight': healingLight,
	'heartOfTheStorm': heartOfTheStorm,
	'hex': hex,
	'holyWeapon': holyWeapon,
	'hybridTransformation': hybridTransformation,
	'lightningArrow': lightningArrow,
	'massCureWounds': massCureWounds,
	'mirrorImage': mirrorImage,
	'monster': monster,
	'muddledMind': muddledMind,
	'protectionFromEvilAndGood': protectionFromEvilAndGood,
	'radiantSoul': radiantSoul,
	'reaper': reaper,
	'ringOfSpellStoring': ringOfSpellStoring,
	'riteOfTheDawn': riteOfTheDawn,
	'sanctuary': sanctuary,
	'shadowBlade': shadowBlade,
	'shockingGrasp': shockingGrasp,
	'spikeGrowth': spikeGrowth,
	'spiritShroud': spiritShroud,
	'stillnessOfMind': stillnessOfMind,
	'vampiricBite': vampiricBite,
	'vampiricTouch': vampiricTouch,
	'wildhunt': wildhunt,
	'witherAndBloom': witherAndBloom,
	'wrathOfTheStorm': wrathOfTheStorm
}
function actorOnUseMacro(itemName) {
	return 'await chrisPremades.macros.actorOnUse(this, "' + itemName + '");';
}
function actorOnUseMultiPassMacro(itemName) {
	return 'await chrisPremades.macros.actorOnUseMulti(this, "' + itemName + '", args[0].macroPass);'
}
export async function setupMacroFolder() {
	let macroFolder = game.folders.find((folder) => folder.name === 'CPR Macros' && folder.type === 'Macro');
	if (!macroFolder) {
		await Folder.create({
		color: '#117e11',
		name: 'CPR Macros',
		parent: null,
		type: 'Macro'
		});
	}
}
async function createMacro(name, content, isGM) {
	let macroFolder = game.folders.find((folder) => folder.name === 'CPR Macros' && folder.type === 'Macro');
	let data = {
		'name': 'CPR-' + name,
		'type': 'script',
		'img': 'icons/svg/dice-target.svg',
		'scope': 'global',
		'command': content,
		'folder': macroFolder ? macroFolder.id : undefined,
		'flags': {
			'advanced-macros': {
				'runAsGM': isGM
			},
		}
	};
	let existingMacro = game.macros.find((m) => m.name == 'CPR-' + name);
	if (existingMacro) data._id = existingMacro.id;
	let macro = existingMacro
	? existingMacro.update(data)
	: Macro.create(data, {
		temporary: false,
		displaySheet: false,
	});
}
export async function setupWorldMacros() {
	await createMacro('bardicInspirationAttack', actorOnUseMacro('bardicInspirationAttack'), false);
	await createMacro('bardicInspirationDamage', actorOnUseMacro('bardicInspirationDamage'), false);
	await createMacro('bladeFlourish', actorOnUseMacro('bladeFlourish'), false);
	await createMacro('brandOfCastigation', actorOnUseMacro('brandOfCastigation'), false);
	await createMacro('chillTouch', actorOnUseMacro('chillTouch'), false);
	await createMacro('hex', actorOnUseMacro('hex'), false);
	await createMacro('lightningArrowAttack', actorOnUseMacro('lightningArrowAttack'), false);
	await createMacro('lightningArrowDamage', actorOnUseMacro('lightningArrowDamage'), false);
	await createMacro('riteOfTheDawn', actorOnUseMacro('riteOfTheDawn'), false);
	await createMacro('spiritShroud', actorOnUseMacro('spiritShroud'), false);
	await createMacro('thunderGauntlets', actorOnUseMacro('thunderGauntlets'), false);
	await createMacro('voracious', actorOnUseMacro('voracious'), false);
	await createMacro('reaper', actorOnUseMacro('reaper'), false);
	await createMacro('destructiveWrath', actorOnUseMacro('destructiveWrath'), false);
	await createMacro('focusedAim', actorOnUseMacro('focusedAim'), false);
	await createMacro('divineSmite', actorOnUseMacro('divineSmite'), false);
	await createMacro('formOfDread', actorOnUseMacro('formOfDread'), false);
	await createMacro('graveTouched', actorOnUseMacro('graveTouched'), false);
	await createMacro('heartOfTheStorm', actorOnUseMacro('heartOfTheStorm'), false);
	await createMacro('darkOnesBlessing', actorOnUseMacro('darkOnesBlessing'), false);
	await createMacro('radiantSoul', actorOnUseMultiPassMacro('radiantSoul'), false);
	await createMacro('expertDivination', actorOnUseMacro('expertDivination'), false);
	await createMacro('ringOfSpellStoringAttack', actorOnUseMacro('ringOfSpellStoringAttack'), false);
	await createMacro('ringOfSpellStoringCast', actorOnUseMacro('ringOfSpellStoringCast'), false);
}
async function useActorOnUse(workflow, itemName) {
	switch (itemName) {
		default:
			ui.notifications.warn('Invalid actor onUse macro!');
			return;
		case 'chillTouch':
			await chillTouch(workflow);
			break;
		case 'hex':
			await hex.attack(workflow);
			break;
		case 'lightningArrowAttack':
			await lightningArrow.attack(workflow);
			break;
		case 'lightningArrowDamage':
			await lightningArrow.damage(workflow);
			break;
		case 'spiritShroud':
			await spiritShroud.attack(workflow);
			break;
		case 'bardicInspirationAttack':
			await bardicInspiration.attack(workflow);
			break;
		case 'bardicInspirationDamage':
			await bardicInspiration.damage(workflow);
			break;
		case 'bladeFlourish':
			await bladeFlourish(workflow);
			break;
		case 'thunderGauntlets':
			await armorModel.thunderGauntlets(workflow);
			break;
		case 'brandOfCastigation':
			await brandOfCastigation(workflow);
			break;
		case 'riteOfTheDawn':
			await riteOfTheDawn(workflow);
			break;
		case 'voracious':
			await hybridTransformation.voracious(workflow);
			break;
		case 'reaper':
			await reaper(workflow);
			break;
		case 'destructiveWrath':
			await destructiveWrath(workflow);
			break;
		case 'focusedAim':
			await focusedAim(workflow);
			break;
		case 'divineSmite':
			await divineSmite(workflow);
			break;
		case 'formOfDread':
			await formOfDread.attack(workflow);
			break;
		case 'graveTouched':
			await graveTouched.attack(workflow);
			break;
		case 'heartOfTheStorm':
			await heartOfTheStorm.attack(workflow);
			break;
		case 'darkOnesBlessing':
			await darkOnesBlessing(workflow);
			break;
		case 'expertDivination':
			await expertDivination(workflow);
			break;
		case 'ringOfSpellStoringAttack':
			await ringOfSpellStoring.attack(workflow);
			break;
		case 'ringOfSpellStoringSpell':
			await ringOfSpellStoring.spell(workflow);
			break;
	}
}
async function actorOnUseMulti(workflow, itemName, pass) {
	switch (itemName) {
		default:
			ui.notifications.warn('Invalid actor onUse macro!');
			return;
		case 'radiantSoul': 
			await radiantSoul(workflow, pass);
			break;
	}
}