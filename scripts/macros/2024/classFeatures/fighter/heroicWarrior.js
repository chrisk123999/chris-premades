import {genericUtils, workflowUtils} from '../../../../utils.js';
async function use({trigger: {entity: item}}) {
    if (!item.actor.system.attributes.inspiration) await genericUtils.update(item.actor, {'system.attributes.inspiration': true});
}
async function turnStart({trigger: {entity: item, token}}) {
    await workflowUtils.syntheticItemRoll(item, [token], {consumeResources: true, consumeUsage: true});
}
export let heroicWarrior = {
    name: 'Heroic Warrior',
    version: '1.5.12',
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
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 30
        }
    ]
};