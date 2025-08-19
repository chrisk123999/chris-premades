import {itemUtils, socketUtils, thirdPartyUtils, workflowUtils} from '../../../../../utils.js';
async function attack({trigger, workflow}) {
    await thirdPartyUtils.attack(workflow, 'wardingFlare', 'use', {distance: 30, attacker: false});
}
async function use({trigger, workflow}) {
    let item = itemUtils.getItemByIdentifier(workflow.actor, 'improvedWardingFlare');
    if (item) await workflowUtils.syntheticItemRoll(item, Array.from(workflow.targets), {consumeResources: true, consumeUsage: true, userId: socketUtils.firstOwner(item)});
}
export let wardingFlare = {
    name: 'Warding Flare',
    version: '1.3.10',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'scenePreambleComplete',
                macro: attack,
                priority: 200
            }
        ]
    }
};