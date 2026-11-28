import {cpr} from '../../module.mjs';
import {actorUtils, automationUtils, combatUtils, compendiumUtils, documentUtils, effectUtils, genericUtils, itemUtils, rollUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
function getStatus(item) {
    if (documentUtils.getEffectByIdentifier(item, 'firearmBroken')) return 'broken';
    if (documentUtils.getEffectByIdentifier(item, 'firearmDamaged')) return 'damaged';
}
function getMisfireScore(item, config) {
    return Number(config.misfire) + (item.system.prof.hasProficiency ? 0 : Number(config.unproficientPenalty));
}
function statusData(item, status) {
    const label = _loc('CHRISPREMADES.Macros.Generic.Firearm.' + status.capitalize());
    return {
        name: label,
        img: item.img,
        origin: item.uuid,
        system: {magical: false, changes: [{key: 'name', type: 'override', value: '{} (' + label + ')', phase: 'initial', priority: 50}]},
        flags: {cat: {identifier: 'firearm' + status.capitalize()}}
    };
}
function gate({document: item, activity}) {
    if (activity.identifier === 'repair') {
        if (getStatus(item) !== 'damaged') {
            genericUtils.notify('CHRISPREMADES.Macros.Generic.Firearm.NotDamaged', {type: 'info', format: {item: item.name}});
            return true;
        }
        if (!item.actor?.items.some(i => i.type === 'tool' && i.system.type.baseItem === 'tinker')) {
            genericUtils.notify('CHRISPREMADES.Macros.Generic.Firearm.NoTinkers', {type: 'info'});
            return true;
        }
        return;
    }
    if (activity.type !== 'attack') return;
    const status = getStatus(item);
    if (!status) return;
    genericUtils.notify('CHRISPREMADES.Macros.Generic.Firearm.Unusable', {type: 'warn', format: {item: item.name, status: _loc('CHRISPREMADES.Macros.Generic.Firearm.' + status.capitalize())}});
    return true;
}
function recoilStamps(actor) {
    return actor.flags['chris-premades']?.firearmRecoil ?? [];
}
function recoil({document: item, workflow}) {
    if (!item.system.properties.has('recoil') || workflow.activity.type !== 'attack' || !workflow.token) return;
    const token = workflow.token.document;
    if (!combatUtils.isStampedThisTurn(recoilStamps(workflow.actor), token.id, tokenUtils.getCombatData(token))) return;
    const range = itemUtils.getRange(item).value ?? 0;
    if (!workflow.targets.tokens.some(target => !tokenUtils.isWithinDistance(token, target.document, range))) return;
    genericUtils.notify('CHRISPREMADES.Macros.Generic.Firearm.Recoil', {type: 'warn', format: {item: item.name}});
    workflow.aborted = true;
    return true;
}
async function fired({document: item, workflow}) {
    if (!['attack', 'save'].includes(workflow.activity.type) || !workflow.token) return;
    const token = workflow.token.document;
    const combatData = tokenUtils.getCombatData(token);
    const stamp = item.system.properties.has('recoil') && combatData.inCombat ? documentUtils.setFlag(workflow.actor, 'chris-premades', 'firearmRecoil', combatUtils.addTurnStamp(recoilStamps(workflow.actor), token.id, combatData)) : undefined;
    if (!item.system.properties.has('blaring') || actorUtils.getEffectByIdentifier(workflow.actor, 'firearmBlaring')) {
        await stamp;
        return;
    }
    const effectData = documentUtils.getBaseEffectData(item, {
        name: CONFIG.DND5E.itemProperties.blaring.label,
        img: item.img,
        origin: item.uuid,
        identifier: 'firearmBlaring',
        duration: {value: 1, units: 'rounds', expiry: 'turnStart'},
        changes: [{key: 'system.skills.ste.roll.mode', value: '-1', priority: 20, type: 'add'}]
    });
    await Promise.all([stamp, effectUtils.createEffects(workflow.actor, [effectData])]);
}
async function explosive({document: item, workflow}) {
    if (!item.system.properties.has('explosive') || workflow.activity.type !== 'attack' || !workflow.hitTargets.count || workflowUtils.getWorkflowProperty(workflow, 'firearmMisfire')) return;
    const targets = new Set(workflow.hitTargets.tokens.flatMap(token => tokenUtils.findNearby(token.document, 5, {disposition: 'all', includeIncapacitated: true})).filter(nearby => nearby.actor && !workflow.hitTargets.has(nearby)));
    if (!targets.size) return;
    const itemData = await compendiumUtils.getDocumentByIdentifier(cpr.packs.misc.automationItems, 'firearm-explosive', {object: true, translate: 'CHRISPREMADES.Macros.Generic.Firearm.Properties.Explosive'});
    await workflowUtils.syntheticItemDataRoll(itemData, workflow.actor, Array.from(targets));
}
async function misfire({document: item, workflow}) {
    if (!workflow.attackRoll || workflowUtils.getWorkflowProperty(workflow, 'firearmNoMisfire')) return;
    const config = automationUtils.getGenericConfigValues(item, 'chris-premades', 'firearm', configKeys);
    if (!config.misfire || workflow.d20AttackRoll > getMisfireScore(item, config) + Number(workflowUtils.getWorkflowProperty(workflow, 'firearmMisfireBonus') ?? 0)) return;
    workflowUtils.setWorkflowProperty(workflow, 'firearmMisfire', true);
    workflow.hitTargets = new Set();
    await Promise.all([
        MidiQOL.addCardNote(workflow, _loc('CHRISPREMADES.Macros.Generic.Firearm.Misfired', {item: item.name})),
        itemUtils.enchantItem(item, statusData(item, 'damaged'))
    ]);
}
async function repair({document: item, workflow}) {
    if (workflow.activity.identifier !== 'repair') return;
    const damaged = documentUtils.getEffectByIdentifier(item, 'firearmDamaged');
    if (!damaged) return;
    const config = automationUtils.getGenericConfigValues(item, 'chris-premades', 'firearm', configKeys);
    const dc = 8 + getMisfireScore(item, config);
    const roll = await rollUtils.requestRoll(workflow.actor, 'tool', 'tinker', {rollDC: dc});
    if (!roll) return;
    await documentUtils.deleteDocument(damaged);
    const repaired = roll.total >= dc;
    if (!repaired) await itemUtils.enchantItem(item, statusData(item, 'broken'));
    await ChatMessage.implementation.create({speaker: ChatMessage.implementation.getSpeaker({token: workflow.token?.document}), content: _loc('CHRISPREMADES.Macros.Generic.Firearm.' + (repaired ? 'Repaired' : 'Broke'), {item: item._source.name})});
}
/**
 * Applies firearm rules and the explosive, recoil and blaring weapon properties to the weapon. A natural attack roll at
 * or below the misfire score misses and damages the firearm, and a damaged or broken firearm can't attack. The item's
 * `repair` activity rolls a tinker's tools check against 8 + the misfire score, and a failure breaks the firearm. The
 * workflow property `firearmMisfireBonus` raises the misfire score for one attack, and `firearmNoMisfire` stops that
 * attack from misfiring.
 */
export const firearm = {
    rules: 'all',
    version: '2.1.11',
    category: 'mechanics',
    generic: true,
    documents: ['item'],
    roll: [
        {
            pass: 'itemPreTargeting',
            macro: gate,
            priority: 10
        },
        {
            pass: 'itemPreambleComplete',
            macro: recoil,
            priority: 10
        },
        {
            pass: 'itemAttackRollComplete',
            macro: misfire,
            priority: 10
        },
        {
            pass: 'itemRollFinished',
            macro: repair,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: fired,
            priority: 60
        },
        {
            pass: 'itemRollFinished',
            macro: explosive,
            priority: 70
        }
    ],
    genericConfig: {
        misfire: {
            default: 0,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Firearm.Misfire.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Firearm.Misfire.Hint'
        },
        unproficientPenalty: {
            default: 1,
            type: 'number',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.Generic.Firearm.UnproficientPenalty.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Firearm.UnproficientPenalty.Hint'
        }
    }
};
export function registerFirearms() {
    const firearms = game.settings.get('chris-premades', 'firearms');
    if (firearms === 'off') return;
    const thirdParty = firearms === 'thirdParty';
    const firearmKey = 'CHRISPREMADES.Macros.Generic.Firearm.';
    CONFIG.DND5E.weaponTypes.firearm = firearmKey + 'Type';
    CONFIG.DND5E.weaponTypeMap.firearm = 'ranged';
    CONFIG.DND5E.weaponProficiencies.firearm = firearmKey + 'Proficiency';
    CONFIG.DND5E.weaponProficienciesMap.firearm = 'firearm';
    for (const property of cpr.firearmProperties) {
        if (!thirdParty && !cpr.firstPartyFirearmProperties.includes(property)) continue;
        CONFIG.DND5E.itemProperties[property] = {label: firearmKey + 'Properties.' + property.capitalize()};
        CONFIG.DND5E.validProperties.weapon.add(property);
    }
    for (const [baseItem, uuid] of Object.entries(cpr.firearmBaseItems)) {
        if (thirdParty || !cpr.thirdPartyFirearmBaseItems.includes(baseItem)) CONFIG.DND5E.weaponIds[baseItem] = 'Compendium.' + uuid;
    }
}
const configKeys = Object.keys(firearm.genericConfig);
