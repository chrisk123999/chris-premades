import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, effectUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
const translations = 'CHRISPREMADES.Macros.All.StarryForm.';
const forms = ['archer', 'chalice', 'dragon'];
function getForm(effect) {
    return effect.flags['chris-premades']?.starryForm;
}
export const abilityConfig = {
    default: 'wis',
    type: 'select',
    label: 'CHRISPREMADES.Config.Ability',
    category: 'homebrew',
    get options() { return constants.abilityOptions; }
};
export async function prepareAbility({activity}) {
    const ability = automationUtils.getConfigValue(activity.item, 'ability') ?? abilityConfig.default;
    for (const entry of activity.item.system.activities) {
        const path = entry.type === 'cast' ? 'spell.ability' : entry.type === 'attack' ? 'attack.ability' : undefined;
        if (path && foundry.utils.getProperty(entry, path) !== ability) await documentUtils.update(entry, {[path]: ability});
    }
}
function spentSpellSlot(workflow) {
    const deltas = (workflow.chatCard ?? game.messages.get(workflow.itemCardId))?.system?.deltas;
    return deltas?.actor?.some(delta => delta.keyPath?.startsWith('system.spells.') && delta.delta < 0);
}
async function chalice({document: effect, workflow}) {
    if (getForm(effect) !== 'chalice' || workflow.item.type !== 'spell' || !workflow.item.system.level || !spentSpellSlot(workflow)) return;
    if (!workflow.damageList?.some(entry => entry.newHP > entry.oldHP)) return;
    const item = effectUtils.getOriginActivitySync(effect)?.item;
    const activity = item ? itemUtils.getActivityByIdentifier(item, 'healing-chalice') : undefined;
    const token = actorUtils.getFirstToken(workflow.actor);
    if (!activity || !token) return;
    const disposition = automationUtils.getConfigValue(item, 'chaliceAnyCreature') ? 'all' : 'ally';
    const range = automationUtils.getConfigValue(item, 'chaliceRange') ?? starryForm.config.chaliceRange.default;
    const candidates = [token, ...tokenUtils.findNearby(token, range, {disposition})];
    const target = candidates.length > 1 ? (await dialogUtils.selectTargetDialog(item.name, translations + 'Chalice', candidates, {skipDeadAndUnconscious: false, coverToken: token, userId: queryUtils.firstOwner(workflow.actor, true)}))?.result : candidates[0];
    if (target) await workflowUtils.completeActivityUse(activity, [target], {consumeResources: false});
}
async function archer({workflow}) {
    if (workflow.activity?.identifier !== 'archer' || !workflow.token) return;
    const arrow = itemUtils.getActivityByIdentifier(workflow.item, 'luminous-arrow');
    if (!arrow) return;
    const token = workflow.token.document;
    const range = automationUtils.getConfigValue(workflow.item, 'archerRange') ?? starryForm.config.archerRange.default;
    const targets = tokenUtils.findNearby(token, range, {disposition: 'all'}).filter(target => tokenUtils.canSee(token, target));
    if (!targets.length) return;
    const selection = await dialogUtils.selectTargetDialog(arrow.name, translations + 'Arrow', targets, {userId: queryUtils.firstOwner(workflow.actor, true), buttons: 'okCancel'});
    const target = selection?.result;
    if (!target) return;
    const activityData = arrow.toObject();
    activityData.activation.type = 'special';
    await workflowUtils.syntheticActivityDataRoll(activityData, workflow.item, [target], {consumeResources: false, spellSlot: false, fast: false});
}
async function turnStart({document: effect, token}) {
    const item = effectUtils.getOriginActivitySync(effect)?.item;
    if (!item || !token?.actor) return;
    const classIdentifier = automationUtils.getConfigValue(item, 'classIdentifier') ?? starryForm.config.classIdentifier.default;
    const swapLevel = automationUtils.getConfigValue(item, 'swapLevel') ?? starryForm.config.swapLevel.default;
    if ((token.actor.classes?.[classIdentifier]?.system.levels ?? 0) < swapLevel) return;
    const current = getForm(effect);
    const activities = forms.filter(form => form !== current).map(form => itemUtils.getActivityByIdentifier(item, form)).filter(Boolean);
    const buttons = activities.map(activity => [activity.name, activity.id]);
    buttons.push([_loc(translations + 'Keep'), false]);
    const choice = await dialogUtils.buttonDialog(item.name, translations + 'Swap', buttons, {userId: queryUtils.firstOwner(token.actor, true)});
    const activity = activities.find(entry => entry.id === choice);
    const effectId = activity?.applicableEffects?.[0]?._id;
    if (!effectId) return;
    const {duration, start} = effect.toObject();
    const effectData = documentUtils.getEffectData(activity, effectId, {duration});
    if (!effectData) return;
    effectData.start = start;
    await documentUtils.deleteDocument(effect);
    await effectUtils.createEffects(token.actor, [effectData]);
}
export const starryForm = {
    name: 'Starry Form',
    version: '2.1.11',
    rules: 'all',
    roll: [
        {
            pass: 'itemPreTargeting',
            macro: prepareAbility,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: archer,
            priority: 50
        }
    ],
    config: {
        classIdentifier: {
            default: 'druid',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        },
        ability: abilityConfig,
        chaliceAnyCreature: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.All.StarryForm.ChaliceAnyCreature',
            category: 'homebrew'
        },
        chaliceRange: {
            default: 30,
            type: 'number',
            label: 'CHRISPREMADES.Macros.All.StarryForm.ChaliceRange',
            category: 'homebrew'
        },
        archerRange: {
            default: 60,
            type: 'number',
            label: 'CHRISPREMADES.Macros.All.StarryForm.ArcherRange',
            category: 'homebrew'
        },
        swapLevel: {
            default: 10,
            type: 'number',
            label: 'CHRISPREMADES.Macros.All.StarryForm.SwapLevel',
            category: 'homebrew'
        }
    },
    scales: [
        {
            identifier: 'starry-form',
            classIdentifier: 'druid',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'starry-form',
                    type: 'dice',
                    scale: {
                        2: {number: 1, faces: 8},
                        10: {number: 2, faces: 8}
                    }
                },
                value: {},
                title: 'Starry Form'
            }
        }
    ]
};
export const starryFormActive = {
    name: 'Starry Form: Active',
    version: starryForm.version,
    rules: 'all',
    combat: [
        {
            pass: 'actorTurnStart',
            macro: turnStart,
            priority: 50
        }
    ],
    roll: [
        {
            pass: 'actorRollFinished',
            macro: chalice,
            priority: 50
        }
    ]
};
