import {actorUtils, automationUtils, constants, documentUtils, effectUtils} from '../../../../proxy.mjs';
function hemocraftAbility(item) {
    return automationUtils.getConfigValue(item, 'ability') || 'int';
}
export function hemocraftModifier(actor) {
    const item = actorUtils.getItemByIdentifier(actor, 'blood-maledict');
    return Math.max(1, actor.system.abilities[item ? hemocraftAbility(item) : 'int'].mod);
}
async function syncHemocraft({document: item}) {
    const effect = documentUtils.getEffectByIdentifier(item, 'hemocraftModifier');
    if (!effect) return;
    const value = '@abilities.' + hemocraftAbility(item) + '.mod';
    const changes = effect.toObject().system.changes;
    if (changes[0].value === value) return;
    changes[0].value = value;
    await documentUtils.update(effect, {'system.changes': changes});
}
function canEnchant(activity, item, errors) {
    if (!documentUtils.getIdentifier(activity.item)?.includes('rite-of-')) return;
    if (item.actor === activity.actor && item.system.equipped) return;
    errors.push(new Error(_loc('CHRISPREMADES.Macros.Legacy.CrimsonRite.NotHolding')));
}
export const crimsonRiteHooks = {canEnchant};
async function dawn({document: enchantment}) {
    const item = effectUtils.getOriginActivitySync(enchantment)?.item;
    const actor = enchantment.parent?.actor;
    if (!item || !actor) return;
    const source = documentUtils.getEffectByIdentifier(item, 'riteOfTheDawnWard');
    if (!source) return;
    const effectData = documentUtils.getEffectData(item, source.id);
    await effectUtils.createEffects(actor, [effectData], {parentEntity: enchantment});
}
async function endRites(actor) {
    const rites = documentUtils.getEffectByIdentifier(actor, 'crimsonRite', {multiple: true, includeItemEffects: true});
    await Promise.all(rites.map(effect => documentUtils.deleteDocument(effect)));
}
async function revive({workflow}) {
    await endRites(workflow.actor);
}
async function rest({document: item}) {
    if (item.actor) await endRites(item.actor);
}
export const bloodMaledict = {
    name: 'Blood Maledict',
    version: '2.1.11',
    rules: '2014',
    item: [
        {
            pass: 'created',
            macro: syncHemocraft,
            priority: 50
        },
        {
            pass: 'medkit',
            macro: syncHemocraft,
            priority: 50
        },
        {
            pass: 'updated',
            macro: syncHemocraft,
            priority: 50
        }
    ],
    config: {
        classIdentifier: {
            default: 'blood-hunter',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        },
        ability: {
            default: 'int',
            type: 'select',
            label: 'CHRISPREMADES.Config.Ability',
            hint: 'CHRISPREMADES.Macros.Legacy.BloodMaledict.Ability.Hint',
            category: 'homebrew',
            get options() { return constants.abilityOptions; }
        }
    },
    scales: [
        {
            identifier: 'crimson-rite',
            classIdentifier: 'blood-hunter',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {units: ''},
                    identifier: 'crimson-rite',
                    type: 'dice',
                    scale: {1: {number: 1, faces: 4, modifiers: []}, 5: {number: 1, faces: 6, modifiers: []}, 11: {number: 1, faces: 8, modifiers: []}, 17: {number: 1, faces: 10, modifiers: []}}
                },
                value: {},
                title: 'Hemocraft Die'
            }
        }
    ]
};
export const crimsonRite = {
    name: 'Crimson Rite',
    version: bloodMaledict.version,
    rules: '2014',
    rest: [
        {
            pass: 'actorShort',
            macro: rest,
            priority: 50
        }
    ]
};
export const riteOfTheDawn = {
    name: 'Crimson Rite: Rite of the Dawn',
    version: bloodMaledict.version,
    rules: '2014',
    effect: [
        {
            pass: 'created',
            macro: dawn,
            priority: 50
        }
    ]
};
export const riteRevival = {
    name: 'Rite Revival',
    version: bloodMaledict.version,
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: revive,
            priority: 50
        }
    ]
};
