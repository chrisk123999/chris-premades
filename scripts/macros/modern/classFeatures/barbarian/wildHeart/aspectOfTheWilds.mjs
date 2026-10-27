import {workflowUtils} from '../../../../../proxy.mjs';
async function long({document, token}) {
    await workflowUtils.completeItemUse(document, token ? [token.document ?? token] : []);
}
export const aspectOfTheWilds = {
    name: 'Aspect of the Wilds',
    version: '2.1.4',
    rules: '2024',
    rest: [
        {
            pass: 'actorLong',
            macro: long,
            priority: 50
        }
    ]
};
