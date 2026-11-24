import {actorUtils, automationUtils, dialogUtils, documentUtils, queryUtils, rollUtils, summonUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
const pending = new Set();
function getSpirit(item) {
    const ownerToken = actorUtils.getFirstToken(item.actor);
    if (!ownerToken) return;
    const range = automationUtils.getConfigValue(item, 'range') ?? blazingRevival.config.range.default;
    return summonUtils.getSummons(item.actor).find(summon => summon.sourceItem && documentUtils.getIdentifier(summon.sourceItem) === 'summon-wildfire-spirit'
        && summon.token?.parent === ownerToken.parent && summon.actor?.system.attributes.hp.value > 0 && tokenUtils.isWithinDistance(ownerToken, summon.token, range));
}
async function unconscious({document: item, effect}) {
    const actor = item.actor;
    if (!effect.statuses.has('unconscious') || !actor || actor.system.attributes.hp.value > 0 || pending.has(item.uuid)) return;
    if (item.system.uses.max && !item.system.uses.value) return;
    const spirit = getSpirit(item);
    if (!spirit) return;
    pending.add(item.uuid);
    try {
        if (!await dialogUtils.confirmUseItem(item, {userId: queryUtils.firstOwner(actor, true)})) return;
        await workflowUtils.completeItemUse(item, [], {options: {workflowOptions: {allowIncapacitated: true}}});
        await documentUtils.update(spirit.actor, {'system.attributes.hp.value': 0});
        const hp = rollUtils.rollDiceSync(automationUtils.getConfigValue(item, 'hitPoints') || blazingRevival.config.hitPoints.default, {document: item}).total;
        await documentUtils.update(actor, {'system.attributes.hp.value': hp});
        const conditions = ['unconscious', 'prone'].map(id => actorUtils.getEffectByStatusID(actor, id)).filter(Boolean);
        await Promise.all(conditions.map(condition => documentUtils.deleteDocument(condition)));
    } finally {
        pending.delete(item.uuid);
    }
}
export const blazingRevival = {
    name: 'Blazing Revival',
    version: '2.1.11',
    rules: '2014',
    effect: [
        {
            pass: 'actorCreated',
            macro: unconscious,
            priority: 50
        }
    ],
    config: {
        range: {
            default: 120,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            category: 'homebrew'
        },
        hitPoints: {
            default: 'floor(@attributes.hp.effectiveMax / 2)',
            type: 'formula',
            label: 'CHRISPREMADES.Config.HitPoints',
            category: 'homebrew'
        }
    }
};
