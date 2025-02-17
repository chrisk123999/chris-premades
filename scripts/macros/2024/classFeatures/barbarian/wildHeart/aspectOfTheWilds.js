import {workflowUtils} from '../../../../../utils.js';
async function rest({trigger: {entity: item}}) {
    await workflowUtils.completeItemUse(item);
}
export let aspectOfTheWilds = {
    name: 'Aspect of the Wilds',
    version: '1.1.23',
    rules: 'modern',
    rest: [
        {
            pass: 'long',
            macro: rest,
            priority: 50
        }
    ]
};