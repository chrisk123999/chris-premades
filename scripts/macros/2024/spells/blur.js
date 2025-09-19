import {constants, effectUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function attacked({trigger, workflow}) {
    if (!workflow.targets.size || !workflowUtils.isAttackType(workflow, 'attack') || !workflow.token) return;
    if (tokenUtils.canSense(workflow.token, workflow.targets.first(), ['blindsight', 'seeAll'])) return;
    workflow.disadvantage = true;
    workflow.rollOptions.disadvantage = false;
    workflow.attackAdvAttribution.add('DIS: ' + trigger.entity.name);
}
async function use({trigger, workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item)
    };
    await effectUtils.createEffect(workflow.actor, effectData, {
        identifier: 'blurEffect',
        concentrationItem: workflow.item,
        interdependent: true,
        rules: 'modern',
        macros: [{type: 'midi.actor', macros: ['blurEffect']}]
    });
}
export let blur = {
    name: 'Blur',
    version: '1.1.17',
    rules: 'modern',
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
export let blurEffect = {
    name: blur.name,
    version: blur.version,
    rules: blur.rules,
    midi: {
        actor: [
            {
                pass: 'targetPreambleComplete',
                macro: attacked,
                priority: 50
            }
        ]
    }
};
