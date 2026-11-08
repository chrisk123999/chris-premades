import {activityUtils, automationUtils, constants, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
function getConfig(effect, key) {
    return effect.flags.cat?.config?.[key] ?? automationUtils.getOriginConfigValue(effect, key) ?? [];
}
function hasDisadvantage(effect, workflow) {
    const actionType = workflowUtils.getActionType(workflow);
    const baseItem = workflow.item.system.type?.baseItem;
    if (actionType === 'mwak') {
        if (workflow.actor.system.attributes.movement.swim) return false;
        if (getConfig(effect, 'meleeWeapons').includes(baseItem)) return false;
        const damageTypes = getConfig(effect, 'meleeDamageTypes');
        return !damageTypes.some(type => workflow.activity.damage?.parts[0]?.types.has(type));
    }
    if (actionType !== 'rwak') return false;
    return !getConfig(effect, 'rangedWeapons').includes(baseItem);
}
async function attack({document: effect, workflow}) {
    if (!hasDisadvantage(effect, workflow)) return;
    workflow.tracker.disadvantage.add('underwater', effect.name);
}
async function range({workflow}) {
    if (!workflow.token || workflow.targets.size !== 1 || workflowUtils.getActionType(workflow) !== 'rwak') return;
    const range = workflow.item.type === 'weapon' ? itemUtils.getRange(workflow.item).value : activityUtils.getRange(workflow.activity);
    if (!range) return;
    if (tokenUtils.isWithinDistance(workflow.token.document, workflow.targets.first().document, range)) return;
    genericUtils.notify('CHRISPREMADES.Macros.All.Underwater.TooFar', {type: 'warn'});
    return true;
}
export const underwater = {
    name: 'Underwater',
    version: '2.1.8',
    rules: 'all',
    roll: [
        {
            pass: 'actorAttackRollConfig',
            macro: attack,
            priority: 50
        },
        {
            pass: 'actorPreItemRoll',
            macro: range,
            priority: 50
        }
    ]
};
const weaponConfig = (key, defaults) => ({
    default: defaults,
    type: 'select-many',
    category: 'homebrew',
    label: 'CHRISPREMADES.Macros.All.Underwater.' + key,
    hint: 'CHRISPREMADES.Macros.All.Underwater.' + key + 'Hint',
    get options() { return constants.weaponOptions; }
});
export const underwaterLegacy = {
    name: underwater.name,
    version: underwater.version,
    rules: '2014',
    config: {
        meleeWeapons: weaponConfig('MeleeWeapons', ['dagger', 'javelin', 'shortsword', 'spear', 'trident']),
        rangedWeapons: weaponConfig('RangedWeapons', ['dart', 'handcrossbow', 'heavycrossbow', 'javelin', 'lightcrossbow', 'net', 'spear', 'trident'])
    }
};
export const underwaterModern = {
    name: underwater.name,
    version: underwater.version,
    rules: '2024',
    config: {
        meleeDamageTypes: {
            default: ['piercing'],
            type: 'select-many',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.All.Underwater.MeleeDamageTypes',
            hint: 'CHRISPREMADES.Macros.All.Underwater.MeleeDamageTypesHint',
            get options() { return constants.damageTypeOptions; }
        },
        rangedWeapons: weaponConfig('RangedWeapons', [])
    }
};
