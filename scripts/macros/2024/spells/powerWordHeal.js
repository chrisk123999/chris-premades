import {actorUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let validConditions = itemUtils.getConfig(workflow.item, 'conditions');
    await Promise.all(workflow.targets.map(async token => {
        let removeIds = Array.from(token.actor.statuses).filter(i => validConditions.includes(i)).map(j => effectUtils.getEffectByStatusID(token.actor, j)).map(k => k.id);
        if (removeIds.length) await genericUtils.deleteEmbeddedDocuments(token.actor, 'ActiveEffect', removeIds);
        if (token.actor.statuses.has('prone') && !actorUtils.hasUsedReaction(token.actor)) {
            let selection = await dialogUtils.confirm(workflow.item.name, 'CHRISPREMADES.Macros.PowerWordHeal.Prone', {userId: socketUtils.firstOwner(token.actor, true)});
            if (selection) {
                let effect = effectUtils.getEffectByStatusID(token.actor, 'prone');
                if (effect) await genericUtils.remove(effect);
                await actorUtils.setReactionUsed(token.actor);
            }
        }
    }));
}
export let powerWordHeal = {
    name: 'Power Word Heal',
    version: '1.1.34',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'conditions',
            label: 'CHRISPREMADES.Config.Conditions',
            type: 'select-many',
            default: ['charmed', 'frightened', 'paralizyed', 'poisoned', 'stunned'],
            options: constants.statusOptions,
            category: 'homebrew',
            homebrew: true
        }
    ]
};