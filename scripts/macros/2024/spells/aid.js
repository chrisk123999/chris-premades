import {effectUtils, itemUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'system.attributes.hp.tempmax',
                mode: 2,
                value: 5 * (workflow.castData.castLevel - 1),
                priority: 20
            }
        ],
        origin: workflow.item.uuid
    };
    await Promise.all(workflow.targets.map(async token => {
        await effectUtils.createEffect(token.actor, effectData);
    }));
}
export let aid = {
    name: 'Aid',
    version: '1.1.7',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'damageRollComplete',
                macro: use,
                priority: 50
            }
        ]
    }
};