import {actorUtils, automationUtils, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
const identifiers = {weal: 'cosmicOmenWeal', woe: 'cosmicOmenWoe'};
function omenEffects(actor) {
    return actorUtils.getEffects(actor).filter(effect => Object.values(identifiers).includes(documentUtils.getIdentifier(effect)));
}
async function use({workflow}) {
    if (workflow.activity.identifier !== 'omen') return;
    const total = workflow.utilityRolls?.[0]?.total;
    if (!total) return;
    const omen = total % 2 ? 'woe' : 'weal';
    await Promise.all(omenEffects(workflow.actor).map(effect => documentUtils.deleteDocument(effect)));
    const activity = itemUtils.getActivityByIdentifier(workflow.item, omen);
    const effect = workflow.item.effects.find(entry => documentUtils.getIdentifier(entry) === identifiers[omen]);
    if (!activity || !effect) return;
    const effectData = documentUtils.getEffectData(activity, effect.id);
    genericUtils.setProperty(effectData, 'flags.cat.activityUuid', activity.uuid);
    await effectUtils.createEffects(workflow.actor, [effectData]);
}
async function longRest({document: item}) {
    await Promise.all(omenEffects(item.actor).map(effect => documentUtils.deleteDocument(effect)));
}
async function initiative({document: effect, token}) {
    const owner = effect.parent;
    const omen = documentUtils.getIdentifier(effect) === identifiers.weal ? 'weal' : 'woe';
    const activity = await fromUuid(effect.flags.cat?.activityUuid ?? '');
    const ownerToken = actorUtils.getFirstToken(owner);
    if (!activity || !token?.actor || !ownerToken || ownerToken.parent !== token.parent) return;
    if (owner.statuses.has('incapacitated') || actorUtils.hasUsedReaction(owner) || !activity.item.system.uses.value) return;
    const range = automationUtils.getConfigValue(activity.item, 'range') ?? cosmicOmen.config.range.default;
    if (!tokenUtils.isWithinDistance(ownerToken, token, range) || (ownerToken !== token && !tokenUtils.canSee(ownerToken, token))) return;
    const prompt = _loc('CHRISPREMADES.Macros.All.CosmicOmen.Initiative', {omen: activity.name, name: token.name});
    if (!await dialogUtils.confirm(activity.item.name, prompt, {userId: queryUtils.firstOwner(owner, true)})) return;
    await workflowUtils.completeActivityUse(activity, [token]);
    const formula = automationUtils.getConfigValue(activity.item, 'formula') || cosmicOmen.config.formula.default;
    const [bonus] = await effectUtils.createEffects(token.actor, [{
        name: activity.name,
        img: activity.item.img,
        origin: effect.uuid,
        system: {changes: [{key: 'system.attributes.init.bonus', type: 'add', value: omen === 'weal' ? '+' + formula : '-(' + formula + ')', priority: 20}]},
        flags: {cat: {identifier: 'cosmicOmenInitiative'}}
    }]) ?? [];
    if (!bonus) return;
    const hookId = Hooks.on('updateCombatant', async (combatant, updates) => {
        if (combatant.tokenId !== token.id || !('initiative' in updates)) return;
        Hooks.off('updateCombatant', hookId);
        await documentUtils.deleteDocument(bonus);
    });
}
export const cosmicOmen = {
    name: 'Cosmic Omen',
    version: '2.1.11',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    rest: [
        {
            pass: 'actorLong',
            macro: longRest,
            priority: 50
        }
    ],
    config: {
        range: {
            default: 30,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            category: 'homebrew'
        },
        formula: {
            default: '1d6',
            type: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'homebrew'
        }
    }
};
export const cosmicOmenActive = {
    name: 'Cosmic Omen: Active',
    version: cosmicOmen.version,
    rules: 'all',
    combat: [
        {
            pass: 'scenePreInitiative',
            macro: initiative,
            priority: 50
        }
    ]
};
