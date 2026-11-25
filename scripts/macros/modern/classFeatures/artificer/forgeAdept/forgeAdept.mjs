import {actorUtils, automationUtils, combatUtils, constants, DamageBonus, dataUtils, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
import {applyDamageType} from '../../../../generic/selectDamageType.mjs';
function isGhaalShaarat(item) {
    return !!item?.flags['chris-premades']?.ghaalShaarat;
}
function getWielded(actor) {
    return actor.items.find(item => item.type === 'weapon' && item.system.equipped && isGhaalShaarat(item));
}
async function refreshSoulBound(actor) {
    const effect = actorUtils.getItemByIdentifier(actor, 'perfect-weapon')?.effects.find(effect => effect.transfer);
    if (!effect) return;
    const disabled = !getWielded(actor);
    if (effect.disabled !== disabled) await documentUtils.update(effect, {disabled});
}
async function imbue({document: enchantment}) {
    const actor = enchantment.parent?.actor;
    const origin = effectUtils.getOriginActivitySync(enchantment)?.item;
    if (!actor || !origin) return;
    const others = actor.items.contents.flatMap(item => item.effects.contents).filter(effect => effect !== enchantment && effect.type === 'enchantment' && effectUtils.getOriginActivitySync(effect)?.item?.uuid === origin.uuid);
    await Promise.all(others.map(effect => documentUtils.deleteDocument(effect)));
    await refreshSoulBound(actor);
}
async function wielding({workflow}) {
    if (getWielded(workflow.actor)) return;
    genericUtils.notify('CHRISPREMADES.Macros.Modern.RunesOfWar.NotWielding', {type: 'warn'});
    workflow.aborted = true;
    return true;
}
async function transfer({document: item, workflow}) {
    if (!isGhaalShaarat(workflow.item) || !workflow.token || !combatUtils.isOwnTurn(workflow.token.document)) return;
    const combatData = tokenUtils.getCombatData(workflow.token.document);
    const stamps = item.flags['chris-premades']?.perfectWeapon?.stamps ?? [];
    if (!combatData.inCombat || combatUtils.isStampedThisTurn(stamps, workflow.token.id, combatData)) return;
    await documentUtils.setFlag(item, 'chris-premades', 'perfectWeapon.stamps', combatUtils.addTurnStamp(stamps, workflow.token.id, combatData));
    const total = dnd5e.utils.simplifyBonus(workflow.item.system.magicalBonus, workflow.item.getRollData());
    if (!total) return;
    const buttons = Array.from({length: total}, (_, index) => [String(index + 1), index + 1]);
    const amount = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.Modern.PerfectWeapon.Transfer', [...buttons, ['CHRISPREMADES.Config.None', false]], {displayAsRows: false, userId: queryUtils.firstOwner(workflow.actor, true)});
    if (!amount) return;
    const effectData = documentUtils.getEffectData(item, 'sQNULfaQtW9uocvK');
    if (!effectData) return;
    effectData.system.changes[0].value = String(amount);
    const acEffect = (await effectUtils.createEffects(workflow.actor, [effectData]))?.[0];
    if (!acEffect) return;
    const penalty = {name: item.name, img: item.img, system: {changes: [{key: 'system.magicalBonus', type: 'override', value: String(total - amount), priority: 50}]}};
    dataUtils.setOrigin(penalty, item);
    const weapon = workflow.actor.items.get(workflow.item.id) ?? workflow.item;
    const enchantment = await itemUtils.enchantItem(weapon, penalty);
    if (enchantment) await documentUtils.makeDependent(acEffect, [enchantment]);
    workflow.item.system.magicalBonus = String(total - amount);
}
async function elementalStrike({document: item, workflow}) {
    if (!workflow.hitTargets.count || !isGhaalShaarat(workflow.item) || !workflowUtils.isAttackType(workflow, 'attack')) return;
    const userId = queryUtils.firstOwner(workflow.actor, true);
    const elements = automationUtils.getConfigValue(item, 'damageTypes');
    if (!elements.length) return;
    const buttons = elements.map(element => [CONFIG.DND5E.damageTypes[element].label, element]);
    const type = elements.length > 1 ? await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.Modern.PerfectWeapon.Element', buttons, {userId}) ?? elements[0] : elements[0];
    const base = workflow.damageRolls?.[0];
    if (base && base.options.type !== type && await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.Modern.PerfectWeapon.Convert', {type: CONFIG.DND5E.damageTypes[type].label}), {userId})) await applyDamageType(workflow, type);
    return new DamageBonus(item, {formula: automationUtils.getConfigValue(item, 'formula'), type, optional: false});
}
async function equipChanged({actor, item}) {
    if (item.type !== 'weapon') return;
    await refreshSoulBound(actor);
    if (getWielded(actor)) return;
    const runes = actorUtils.getItemByIdentifier(actor, 'runes-of-war');
    const auras = runes ? actor.effects.filter(effect => effect.flags.cat?.macros?.aura && effectUtils.getOriginActivitySync(effect)?.item?.uuid === runes.uuid) : [];
    await Promise.all(auras.map(effect => documentUtils.deleteDocument(effect)));
}
async function added({actor}) {
    await refreshSoulBound(actor);
}
export const ghaalShaarat = {
    name: 'Ghaal\'Shaarat',
    version: '2.1.11',
    rules: '2024',
    effect: [
        {
            pass: 'created',
            macro: imbue,
            priority: 50
        }
    ]
};
export const runesOfWar = {
    name: 'Runes of War',
    version: ghaalShaarat.version,
    rules: '2024',
    roll: [
        {
            pass: 'itemPreItemRoll',
            macro: wielding,
            priority: 50
        }
    ]
};
export const perfectWeapon = {
    name: 'Perfect Weapon',
    version: ghaalShaarat.version,
    rules: '2024',
    roll: [
        {
            pass: 'actorPreambleComplete',
            macro: transfer,
            priority: 100
        },
        {
            pass: 'actorOptionalBonusDamage',
            macro: elementalStrike,
            priority: 250
        }
    ],
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'actorEquipped',
            macro: equipChanged,
            priority: 50
        },
        {
            pass: 'actorUnequipped',
            macro: equipChanged,
            priority: 50
        }
    ],
    config: {
        damageTypes: {
            default: ['acid', 'cold', 'fire', 'lightning', 'thunder'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.DamageTypes',
            category: 'homebrew',
            get options() { return constants.damageTypeOptions; }
        },
        formula: {
            default: '1d6',
            type: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'homebrew'
        }
    }
};
