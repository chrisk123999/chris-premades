import {documentUtils, workflowUtils} from '../../../../../proxy.mjs';
async function use({document}) {
    if (!document.actor.system.attributes.inspiration) await documentUtils.update(document.actor, {'system.attributes.inspiration': true});
}
async function turnStart({document, token}) {
    await workflowUtils.completeItemUse(document, token ? [token.document ?? token] : []);
}
export const heroicWarrior = {
    name: 'Heroic Warrior',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    combat: [
        {
            pass: 'actorTurnStart',
            macro: turnStart,
            priority: 30
        }
    ]
};
