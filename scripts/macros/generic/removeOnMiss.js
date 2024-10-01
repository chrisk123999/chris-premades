import {genericUtils} from '../../utils.js';

async function attack({trigger, workflow}) {
    if (workflow.targets.size !== 1) return;
    let isMiss = workflow.isFumble;
    let targetToken = workflow.targets.first();
    let attackTotal = workflow.attackTotal;
    if (targetToken.actor.system.attributes.ac.value > attackTotal) isMiss = true;
    if (isMiss) await genericUtils.remove(trigger.entity);
}
export let removeOnMiss = {
    name: 'Remove on Miss',
    version: '1.0.2',
    midi: {
        actor: [
            {
                pass: 'postAttackRoll',
                macro: attack,
                priority: 100
            }
        ]
    }
};