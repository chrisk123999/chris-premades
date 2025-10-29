import {genericUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function attack({trigger, workflow}) {
    switch (workflowUtils.getActionType(workflow)) {
        case 'mwak':
            if (workflow.actor.system.attributes.movement.swim) return;
            if (workflow.defaultDamageType === 'piercing') return;
        // eslint-disable-next-line no-fallthrough
        case 'rwak':
            workflow.disadvantage = true;
            workflow.attackAdvAttribution.add(genericUtils.translate('CHRISPREMADES.Macros.Underwater.Underwater'));
    }
}
async function range({trigger, workflow}) {
    if (workflow.targets.size != 1) return;
    let distance = tokenUtils.getDistance(workflow.token, workflow.targets.first());
    if (distance <= (workflow.activity.range.value ?? workflow.activity.range.reach)) return;
    genericUtils.notify('CHRISPREMADES.Macros.Underwater.TooFar', 'warn');
    return true;
}
export let underwater = {
    name: 'Underwater',
    version: '1.3.115',
    rules: 'modern'
};
export let underwaterEffect = {
    name: 'Underwater: Effect',
    version: underwater.version,
    rules: underwater.rules,
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: attack,
                priority: 1
            },
            {
                pass: 'preItemRoll',
                macro: range,
                priority: 1
            }
        ]
    }
};