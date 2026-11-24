import {actorUtils, automationUtils, combatUtils, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, Logging, queryUtils, tokenUtils, workflowUtils} from '../../../../proxy.mjs';
import {getBondToken, markAware} from './eyesOfTheGate.mjs';
const translations = 'CHRISPREMADES.Macros.Legacy.BalefulInterdict.';
const sealIdentifier = 'balefulInterdictSeal';
function interdictFlags(actor) {
    return actor.flags['chris-premades']?.balefulInterdict ?? {};
}
export function getRange(item) {
    return Number(itemUtils.getActivityByIdentifier(item, 'place')?.range.value) || 30;
}
export function originItem(seal) {
    const origin = effectUtils.getOriginSync(seal);
    return origin?.documentName === 'Item' ? origin : origin?.item ?? origin?.parent;
}
export function getSeals(target, item) {
    return actorUtils.getEffects(target).filter(effect => effect.flags.cat?.identifier === sealIdentifier && (!item || originItem(effect)?.uuid === item.uuid));
}
function isPlaced(token, item) {
    const combatData = tokenUtils.getCombatData(token);
    return combatUtils.isStampedThisTurn(item.flags['chris-premades']?.balefulInterdict?.stamps ?? [], token.id, combatData);
}
async function stamp(token, item) {
    const stamps = combatUtils.addTurnStamp(item.flags['chris-premades']?.balefulInterdict?.stamps ?? [], token.id, tokenUtils.getCombatData(token));
    await documentUtils.setFlag(item, 'chris-premades', 'balefulInterdict.stamps', stamps);
}
async function offerBoons(item, event, data) {
    const results = await automationUtils.calledEvent(event, item.actor, {multiResult: true, canOverlap: true, data});
    const boons = results.flat().filter(result => result?.activity);
    if (!boons.length) return;
    const userId = queryUtils.firstOwner(item.actor, true);
    const passive = boons.filter(boon => !boon.activity.consumption.targets.length);
    const active = boons.filter(boon => !passive.includes(boon));
    const activity = active.length && await dialogUtils.selectDocumentDialog(_loc(translations + 'Boons'), _loc(translations + 'BoonsPrompt'), active.map(boon => boon.activity), {userId, addNoneDocument: true});
    if (activity) await active.find(boon => boon.activity === activity).use();
    for (const boon of passive) {
        if (await dialogUtils.confirmUseItem(boon.activity.item, {userId})) await boon.use();
    }
}
export async function burnSeals(item, target, count, {multiplier = 1, userId} = {}) {
    const seals = getSeals(target.actor, item).slice(0, count);
    if (!seals.length) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'burn');
    const config = automationUtils.getConfigValues(item, ['classIdentifier', 'damageScale']);
    const scale = item.actor.system.scale[config.classIdentifier]?.[config.damageScale];
    if (!activity || !scale) return Logging.addMacroWarning('chris-premades', 'baleful-interdict', 'Missing burn activity or damage scale.', {notify: 'warn'});
    const damageType = await dialogUtils.selectDamageType(['fire', 'necrotic'], item.name, translations + 'DamageType', {userId}) || 'fire';
    const activityData = activity.toObject();
    activityData.damage.parts[0].custom = {enabled: true, formula: (seals.length * scale.number * multiplier) + 'd' + scale.faces};
    activityData.damage.parts[0].types = [damageType];
    if (interdictFlags(item.actor).ignoreResistance) genericUtils.setProperty(activityData, 'midiProperties.ignoreTraits', ['idr']);
    const burnWorkflow = await workflowUtils.syntheticActivityDataRoll(activityData, item, [target]);
    await Promise.all(seals.map(seal => documentUtils.deleteDocument(seal)));
    await offerBoons(item, 'interdictSealBurned', {target, count: seals.length, damageType, damageTotal: burnWorkflow?.damageTotal ?? 0, workflow: burnWorkflow});
    return burnWorkflow;
}
async function burn({document: effect, workflow}) {
    const target = actorUtils.getFirstToken(effect.parent);
    if (!target || documentUtils.getIdentifier(workflow.item) === 'baleful-interdict') return;
    if (!workflow.damageList?.some(ditem => ditem.actorUuid === effect.parent.uuid && ditem.totalDamage > 0)) return;
    const items = new Set(getSeals(effect.parent).map(originItem).filter(item => item?.actor));
    for (const item of items) {
        if (item.actor.statuses.has('incapacitated')) continue;
        const ownerToken = actorUtils.getFirstToken(item.actor);
        const bondToken = getBondToken(item.actor);
        const origin = [ownerToken, bondToken].find(token => token && token.parent === target.parent && tokenUtils.isWithinDistance(token, target, getRange(item)) && tokenUtils.canSee(token, target));
        if (!origin) continue;
        if (origin === bondToken && origin !== ownerToken) await markAware(item.actor);
        const seals = getSeals(effect.parent, item);
        const userId = queryUtils.firstOwner(item.actor, true);
        const count = await dialogUtils.numberDialog(item.name, _loc(translations + 'BurnPrompt', {target: target.name}), {label: _loc(translations + 'Seals'), name: 'count', options: {currentValue: seals.length}}, {userId});
        if (!Number(count)) continue;
        await burnSeals(item, target, Number(count), {userId});
    }
}
async function placeOnHit({document: item, workflow}) {
    if (!workflow.hitTargets.count || !workflow.token || !workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    if (getSeals(workflow.hitTargets.documents[0].actor, item).length) await offerBoons(item, 'interdictHit', {target: workflow.hitTargets.documents[0], workflow});
    if (!combatUtils.isOwnTurn(workflow.token.document) || isPlaced(workflow.token.document, item) || !item.system.uses.value) return;
    const target = workflow.hitTargets.documents[0];
    if (!tokenUtils.isWithinDistance(workflow.token.document, target, getRange(item))) return;
    if (!await dialogUtils.confirm(item.name, _loc(translations + 'PlacePrompt', {target: target.name}))) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'place-hit');
    if (activity) await workflowUtils.completeActivityUse(activity, [target]);
}
async function checkTurn({document: item, workflow}) {
    if (!['place', 'place-hit'].includes(workflow.activity.identifier)) return;
    if (!workflow.token || !isPlaced(workflow.token.document, item)) return;
    genericUtils.notify(translations + 'AlreadyPlaced', {type: 'info'});
    workflow.aborted = true;
}
async function used({document: item, workflow}) {
    if (workflow.activity.identifier === 'move') return await move({document: item, workflow});
    if (!['place', 'place-hit', 'place-reaction'].includes(workflow.activity.identifier)) return;
    const target = workflow.targets.documents[0];
    if (!target || !workflow.token) return;
    if (workflow.activity.identifier !== 'place-reaction') await stamp(workflow.token.document, item);
    await offerBoons(item, 'interdictSealPlaced', {target, bonusAction: workflow.activity.identifier === 'place', workflow});
}
async function move({document: item, workflow}) {
    const target = workflow.targets.documents[0];
    if (!target) return;
    if (!tokenUtils.canSee(workflow.token.document, target)) return genericUtils.notify('CHRISPREMADES.Generic.CannotSee', {type: 'info'});
    const sources = workflow.token.document.parent.tokens.filter(token => token !== target && token.actor && (token.actor.statuses.has('dead') || !token.actor.system.attributes.hp.value) && getSeals(token.actor, item).length && tokenUtils.isWithinDistance(token, target, 30));
    if (!sources.length) return genericUtils.notify(translations + 'NoSource', {type: 'info'});
    const source = sources.length === 1 ? sources[0] : (await dialogUtils.selectTargetDialog(item.name, translations + 'SelectSource', sources, {skipDeadAndUnconscious: false}))?.result;
    if (!source) return;
    const seals = getSeals(source.actor, item);
    const effectData = seals.map(seal => {
        const data = seal.toObject();
        delete data._id;
        return data;
    });
    await Promise.all(seals.map(seal => documentUtils.deleteDocument(seal)));
    await effectUtils.createEffects(target.actor, effectData);
    await offerBoons(item, 'interdictSealPlaced', {target, bonusAction: true, moved: true, workflow});
}
export const balefulInterdict = {
    name: 'Baleful Interdict',
    version: '2.1.10',
    rules: '2014',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: placeOnHit,
            priority: 250,
            canOverlap: true
        },
        {
            pass: 'itemPreambleComplete',
            macro: checkTurn,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: used,
            priority: 50,
            canOverlap: true
        }
    ],
    config: {
        classIdentifier: {
            default: 'illrigger',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        },
        damageScale: {
            default: 'baleful-interdict-damage',
            type: 'text',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            category: 'homebrew'
        }
    },
    scales: [
        {
            identifier: 'baleful-interdict',
            classIdentifier: 'illrigger',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {units: ''},
                    identifier: 'baleful-interdict',
                    type: 'number',
                    scale: {1: {value: 3}, 3: {value: 4}, 7: {value: 5}, 13: {value: 6}, 18: {value: 7}}
                },
                value: {},
                title: 'Seals'
            }
        },
        {
            identifier: 'baleful-interdict-damage',
            classIdentifier: 'illrigger',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {units: ''},
                    identifier: 'baleful-interdict-damage',
                    type: 'dice',
                    scale: {1: {number: 1, faces: 6, modifiers: []}, 5: {number: 2, faces: 6, modifiers: []}, 11: {number: 3, faces: 6, modifiers: []}, 20: {number: 4, faces: 6, modifiers: []}}
                },
                value: {},
                title: 'Seal Damage'
            }
        }
    ],
    notes: 'Fires the called events interdictHit ({target, workflow}) on a weapon hit against a sealed target, interdictSealPlaced ({target, bonusAction, moved, workflow}) and interdictSealBurned ({target, count, damageType, damageTotal, workflow}). Listeners return {activity, use} to be offered as a boon. The Place Seal activity range is the seal range. Actor flag chris-premades.balefulInterdict.ignoreResistance lets burned seals ignore resistance.'
};
export const balefulInterdictSeal = {
    name: 'Baleful Interdict: Seal',
    version: balefulInterdict.version,
    rules: balefulInterdict.rules,
    roll: [
        {
            pass: 'targetRollFinished',
            macro: burn,
            priority: 300
        }
    ]
};
