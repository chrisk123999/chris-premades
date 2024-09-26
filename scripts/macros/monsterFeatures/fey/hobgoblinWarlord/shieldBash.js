import {actorUtils, effectUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    await Promise.all(workflow.failedSaves.map(async token => {
        if (!actorUtils.checkTrait(token.actor, 'ci', 'prone') && !effectUtils.getEffectByStatusID(token.actor, 'prone') && actorUtils.getSize(workflow.targets.first().actor, false) <= 3) await effectUtils.applyConditions(token.actor, ['prone']);
    }));
}
export let shieldBash = {
    name: 'Shield Bash',
    version: '0.12.78',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    monster: {
        names: ['Hobgoblin Warlord']
    }
};