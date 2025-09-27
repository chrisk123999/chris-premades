import {effectUtils, genericUtils, tokenUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.failedSaves.size || !workflow.token || !workflow.template) return;
    await Promise.all(workflow.failedSaves.map(async token => {
        let ray = Ray.fromAngle(token.x, token.y, workflow.template.object.ray.angle, workflow.template.object.ray.distance);
        await tokenUtils.moveTokenAlongRay(token, ray, 30);
        await effectUtils.applyConditions(token.actor, ['prone']);
    }));
    let ray = Ray.fromAngle(workflow.token.x, workflow.token.y, workflow.template.object.ray.angle, workflow.template.object.ray.distance);
    await tokenUtils.moveTokenAlongRay(workflow.token, ray, 30);
}
export let shieldCharge = {
    name: 'Shield Charge',
    version: '1.3.73',
    monster: {
        name: 'Fire Giant Dreadnought'
    },
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};