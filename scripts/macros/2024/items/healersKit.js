import {genericUtils} from '../../../utils.js';
async function use({workflow})
{
    let targetActor = workflow.targets.first()?.actor;
    if (!targetActor) return;
    genericUtils.update(targetActor, {'system.attributes.death.success': 3});
}
export let healersKit = {
    name: 'Healer\'s Kit',
    version: '1.2.37',
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
};