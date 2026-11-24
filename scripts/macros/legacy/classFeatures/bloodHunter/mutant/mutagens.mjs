import {actorUtils, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
function getMutagenEffects(actor, side) {
    return actorUtils.getEffects(actor).filter(effect => effect.flags['chris-premades']?.mutagen && (!side || effect.flags['chris-premades'].mutagen === side));
}
function originItem(effect) {
    return effectUtils.getOriginActivitySync(effect)?.item;
}
function empty(item) {
    genericUtils.notify('CHRISPREMADES.Macros.Legacy.Mutagens.NoMutagen', {type: 'warn', format: {feature: item.name}});
    return true;
}
async function pick(item, effects, label, userId) {
    return effects.length === 1 ? effects[0] : await dialogUtils.selectDocumentDialog(item.name, label, effects, {userId});
}
async function flush({workflow}) {
    if (workflow.activity.identifier !== 'flush') return;
    await Promise.all(getMutagenEffects(workflow.actor).map(effect => documentUtils.deleteDocument(effect)));
}
async function suppressPick({document: item, activity, config}) {
    if (activity.identifier !== 'suppress') return;
    const negatives = getMutagenEffects(item.actor, 'negative').filter(effect => !effect.disabled);
    if (!negatives.length) return empty(item);
    const selection = await pick(item, negatives, 'CHRISPREMADES.Macros.Legacy.Mutagens.Suppress', queryUtils.firstOwner(item.actor, true));
    if (!selection) return true;
    workflowUtils.setWorkflowProperty(config.workflow, 'strangeMetabolism', selection.uuid);
}
async function suppress({document: item, workflow}) {
    const selection = fromUuidSync(workflowUtils.getWorkflowProperty(workflow, 'strangeMetabolism'), {strict: false});
    if (!selection) return;
    await documentUtils.update(selection, {disabled: true});
    await effectUtils.createEffects(workflow.actor, [{
        name: item.name,
        img: item.img,
        duration: {value: 1, units: 'minutes'},
        flags: {'chris-premades': {strangeMetabolism: selection.uuid}, cat: {macros: {effect: [{source: 'chris-premades', rules: '2014', identifier: 'strange-metabolism'}]}}}
    }]);
}
async function restore({document: effect}) {
    const suppressed = fromUuidSync(effect.flags['chris-premades']?.strangeMetabolism, {strict: false});
    if (suppressed) await documentUtils.update(suppressed, {disabled: false});
}
async function exaltPick({document: item, activity, config}) {
    if (activity.identifier !== 'exalt') return;
    const userId = queryUtils.firstOwner(item.actor, true);
    const positives = getMutagenEffects(item.actor, 'positive');
    if (!positives.length) return empty(item);
    const current = await pick(item, positives, 'CHRISPREMADES.Macros.Legacy.Mutagens.ExaltEnd', userId);
    if (!current) return true;
    const currentItem = originItem(current);
    const formulas = item.actor.items.filter(other => other !== currentItem && other.system.activities?.some(activity => activity.identifier === 'consume'));
    const next = await dialogUtils.selectDocumentDialog(item.name, 'CHRISPREMADES.Macros.Legacy.Mutagens.ExaltStart', formulas, {userId});
    if (!next) return true;
    workflowUtils.setWorkflowProperty(config.workflow, 'exaltedMutation', {current: currentItem?.uuid, next: next.uuid});
}
async function exalt({workflow}) {
    const {current, next} = workflowUtils.getWorkflowProperty(workflow, 'exaltedMutation') ?? {};
    if (!next) return;
    await Promise.all(getMutagenEffects(workflow.actor).filter(effect => originItem(effect)?.uuid === current).map(effect => documentUtils.deleteDocument(effect)));
    const activity = itemUtils.getActivityByIdentifier(fromUuidSync(next), 'consume');
    if (activity) await workflowUtils.completeActivityUse(activity, [workflow.token.document], {consumeResources: false, options: {proceedChecks: {checkBonusAction: false}}});
}
async function nighteye({document: effect, workflow}) {
    if (workflow.targets.count !== 1 || !workflowUtils.isAttackType(workflow, 'attack') || workflow.tracker.disadvantage.isActive) return;
    const target = workflow.targets.documents[0];
    if (tokenUtils.getLightLevel(workflow.token.document) !== 'bright' && tokenUtils.getLightLevel(target) !== 'bright') return;
    const selection = await dialogUtils.confirm(effect.name, 'CHRISPREMADES.Macros.Legacy.Mutagens.Sunlight', {userId: queryUtils.gmID()});
    if (selection) workflow.tracker.disadvantage.add('mutagen-nighteye', effect.name);
}
function nighteyePerception({skillId}) {
    if (skillId === 'prc') return {label: 'CHRISPREMADES.Macros.Legacy.Mutagens.SunlightCheck', type: 'disadvantage'};
}
async function reconstruction({document: effect, token}) {
    const hp = token?.actor?.system.attributes.hp;
    if (!hp || hp.value < 1 || hp.value >= hp.max / 2) return;
    const item = originItem(effect);
    const activity = item && itemUtils.getActivityByIdentifier(item, 'reconstruction');
    if (activity) await workflowUtils.completeActivityUse(activity, [token]);
}
export const mutagencraft = {
    name: 'Mutagencraft',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: flush,
            priority: 50
        }
    ]
};
export const strangeMetabolism = {
    name: 'Strange Metabolism',
    version: mutagencraft.version,
    rules: '2014',
    roll: [
        {
            pass: 'itemPreTargeting',
            macro: suppressPick,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: suppress,
            priority: 50
        }
    ],
    effect: [
        {
            pass: 'deleted',
            macro: restore,
            priority: 50
        }
    ]
};
export const exaltedMutation = {
    name: 'Exalted Mutation',
    version: mutagencraft.version,
    rules: '2014',
    roll: [
        {
            pass: 'itemPreTargeting',
            macro: exaltPick,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: exalt,
            priority: 50
        }
    ]
};
export const mutagenNighteye = {
    name: 'Formulas: Nighteye',
    version: mutagencraft.version,
    rules: '2014',
    roll: [
        {
            pass: 'actorAttackRollConfig',
            macro: nighteye,
            priority: 50
        }
    ],
    skill: [
        {
            pass: 'actorContext',
            macro: nighteyePerception,
            priority: 50
        }
    ]
};
export const mutagenReconstruction = {
    name: 'Formulas: Reconstruction',
    version: mutagencraft.version,
    rules: '2014',
    combat: [
        {
            pass: 'actorTurnStart',
            macro: reconstruction,
            priority: 50
        }
    ]
};
