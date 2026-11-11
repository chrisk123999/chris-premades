import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, queryUtils, workflowUtils} from '../../../proxy.mjs';
const validActivity = types => activity => types.includes(activity.activation.type) && (activity.activation.value ?? 1) === 1 && !activity.flags.cat?.hidden;
function getReadied(actor) {
    return actorUtils.getEffects(actor).find(effect => effect.flags['chris-premades']?.readySpell);
}
function abort(workflow) {
    workflow.aborted = true;
    return true;
}
async function prepare({document: activity, workflow}) {
    const isValid = validActivity(automationUtils.getConfigValue(activity.item, 'activationTypes') ?? ['action']);
    const spells = actorUtils.getCastableSpells(workflow.actor).filter(spell => spell.system.activities.some(isValid));
    if (!spells.length) {
        genericUtils.notify('CHRISPREMADES.Macros.All.ReadySpell.NoSpells', {type: 'warn'});
        return abort(workflow);
    }
    const spell = spells.length === 1 ? spells[0] : await dialogUtils.selectDocumentDialog(activity.item.name, 'CHRISPREMADES.Macros.All.ReadySpell.SelectSpell', spells, {sort: 'level', showSpellLevel: true});
    if (!spell) return abort(workflow);
    const activities = spell.system.activities.filter(isValid);
    const spellActivity = activities.length === 1 ? activities[0] : await dialogUtils.selectDocumentDialog(activity.item.name, 'CHRISPREMADES.Macros.Generic.SpecialItemUse.SelectActivity', activities);
    if (!spellActivity) return abort(workflow);
    let slot;
    if (spellActivity.requiresSpellSlot && spellActivity.consumption.spellSlot) {
        const slots = await dialogUtils.selectSpellSlots(workflow.actor, activity.item.name, 'CHRISPREMADES.Macros.All.ReadySpell.SelectSlot', {maxAmount: 1, maxAmountMode: 'count', minLevel: spell.system.level});
        if (!slots) return abort(workflow);
        slot = slots[0].key;
    }
    const level = slot ? workflow.actor.system.spells[slot].level : undefined;
    const consumed = await spellActivity.consume({consume: {action: false, resources: true, spellSlot: !!slot}, spell: {slot}, scaling: level ? level - spell.system.level : 0}, {});
    if (!consumed) return abort(workflow);
    const host = workflow.actor.items.get(activity.item.id) ?? actorUtils.getItemByIdentifier(workflow.actor, 'generic-actions');
    workflowUtils.setWorkflowProperty(workflow, 'readySpell', {activityUuid: spellActivity.uuid, itemUuid: host?.uuid, level});
}
function getHolding(actor, effect) {
    return actor.effects.find(concentration => concentration.statuses.has('concentrating') && concentration.getDependents?.().includes(effect));
}
async function endHolding(effect) {
    const holding = await fromUuid(effect.flags['chris-premades']?.readySpell?.concentrationUuid ?? '');
    if (holding) await documentUtils.deleteDocument(holding);
}
async function ready({document: activity, workflow}) {
    const readied = workflowUtils.getWorkflowProperty(workflow, 'readySpell');
    if (!readied) return;
    const identifier = activity.effects[0]?.effect?.flags.cat?.identifier;
    const effect = identifier && actorUtils.getEffectByIdentifier(workflow.actor, identifier);
    if (!effect) return;
    readied.concentrationUuid = getHolding(workflow.actor, effect)?.uuid;
    await documentUtils.update(effect, {'flags.chris-premades.readySpell': readied, 'flags.cat.specialDuration': (effect.flags.cat?.specialDuration ?? []).filter(duration => duration !== 'turnStart')});
    const host = await fromUuid(readied.itemUuid ?? '');
    if (host) await itemUtils.unhideActivities(host, ['release']);
}
async function cast(actor, effect, targets, userId) {
    const {activityUuid, level} = effect.flags['chris-premades'].readySpell;
    const spellActivity = await fromUuid(activityUuid);
    await documentUtils.setFlag(effect, 'chris-premades', 'readySpell.released', true);
    if (spellActivity?.requiresConcentration) await endHolding(effect);
    if (spellActivity) await workflowUtils.completeActivityUse(spellActivity, targets, {userId, atLevel: level, consumeUsage: false, consumeResources: false, spellSlot: false, config: {consume: {action: false}}});
    await endHolding(effect);
    if (actor.effects.has(effect.id)) await documentUtils.deleteDocument(effect);
}
async function release({document: activity, workflow}) {
    const effect = getReadied(workflow.actor);
    if (!effect) {
        genericUtils.notify('CHRISPREMADES.Macros.All.ReadySpell.NotReadied', {type: 'warn'});
        return;
    }
    await cast(workflow.actor, effect, workflow.targets.documents, game.user.id);
}
async function turnStart({document: effect}) {
    const readied = effect.flags['chris-premades']?.readySpell;
    if (!readied || readied.released) return;
    const actor = effectUtils.getActor(effect);
    if (!actor) return;
    const host = await fromUuid(readied.itemUuid ?? '');
    if (host && automationUtils.getConfigValue(host, 'turnStart') === 'lose') {
        await documentUtils.deleteDocument(effect);
        return;
    }
    const spellActivity = await fromUuid(readied.activityUuid);
    const userId = queryUtils.firstOwner(actor, true);
    const selection = await dialogUtils.confirm(effect.name, _loc('CHRISPREMADES.Macros.All.ReadySpell.ReleaseNow', {spell: spellActivity?.item.name ?? ''}), {userId});
    if (!actor.effects.has(effect.id)) return;
    if (!selection) {
        await documentUtils.deleteDocument(effect);
        return;
    }
    const targets = Array.from(game.users.get(userId)?.targets ?? []).map(token => token.document ?? token);
    await cast(actor, effect, targets, userId);
}
async function lost({document: effect}) {
    const readied = effect.flags['chris-premades']?.readySpell;
    if (!readied) return;
    const host = await fromUuid(readied.itemUuid ?? '');
    if (host) await itemUtils.rehideActivities(host, ['release']);
    if (readied.released) return;
    const actor = effectUtils.getActor(effect);
    if (!actor) return;
    await endHolding(effect);
    const spellActivity = await fromUuid(readied.activityUuid);
    await ChatMessage.implementation.create({
        speaker: ChatMessage.implementation.getSpeaker({actor}),
        content: _loc('CHRISPREMADES.Macros.All.ReadySpell.Lost', {actor: actor.name, spell: spellActivity?.item.name ?? ''})
    });
}
export const readySpell = {
    name: 'Ready Spell',
    version: '2.1.8',
    rules: 'all',
    roll: [
        {
            pass: 'activityPreItemRoll',
            macro: prepare,
            priority: 50
        },
        {
            pass: 'activityRollFinished',
            macro: ready,
            priority: 50
        }
    ]
};
export const readySpellRelease = {
    name: 'Ready Spell: Release',
    version: readySpell.version,
    rules: readySpell.rules,
    roll: [
        {
            pass: 'activityRollFinished',
            macro: release,
            priority: 50
        }
    ]
};
export const readySpellHeld = {
    name: 'Ready Spell: Held',
    version: readySpell.version,
    rules: readySpell.rules,
    combat: [
        {
            pass: 'actorTurnStart',
            macro: turnStart,
            priority: 50
        }
    ],
    effect: [
        {
            pass: 'deleted',
            macro: lost,
            priority: 50
        }
    ]
};
export const readyItem = {
    name: 'Ready',
    version: readySpell.version,
    rules: 'all',
    config: {
        activationTypes: {
            default: ['action'],
            type: 'select-many',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.All.ReadySpell.ActivationTypes',
            hint: 'CHRISPREMADES.Macros.All.ReadySpell.ActivationTypesHint',
            get options() { return constants.activationTypeOptions; }
        },
        turnStart: {
            default: 'lose',
            type: 'select',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.All.ReadySpell.TurnStart',
            hint: 'CHRISPREMADES.Macros.All.ReadySpell.TurnStartHint',
            options: [
                {value: 'prompt', label: 'CHRISPREMADES.Macros.All.ReadySpell.TurnStartPrompt'},
                {value: 'lose', label: 'CHRISPREMADES.Macros.All.ReadySpell.TurnStartLose'}
            ]
        }
    }
};
