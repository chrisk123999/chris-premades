import {activityUtils, effectUtils, genericUtils, workflowUtils} from '../../../../utils.js';
function early({activity}) {
    let activityIdentifier = activityUtils.getIdentifier(activity);
    let targetToken = game.user.targets.first();
    if (!targetToken) return;
    let poisoned = effectUtils.getEffectByStatusID(targetToken.actor, 'poisoned');
    let diseased = effectUtils.getEffectByStatusID(targetToken.actor, 'diseased');
    if (activityIdentifier === 'layOnHandsPoison' && !poisoned) {
        genericUtils.notify('CHRISPREMADES.Macros.LayOnHands.TargetNotPoisoned', 'info');
        return true;
    }
    if (activityIdentifier === 'layOnHandsDisease' && !diseased) {
        genericUtils.notify('CHRISPREMADES.Macros.LayOnHands.TargetNotDiseased', 'info');
        return true;
    }
}
async function late({workflow}) {
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    if (!workflow.targets.size) return;
    let targetToken = workflow.targets.first();
    if (activityIdentifier === 'layOnHandsPoison') {
        let poisoned = effectUtils.getEffectByStatusID(targetToken.actor, 'poisoned');
        if (poisoned) await genericUtils.remove(poisoned);
        return;
    }
    if (activityIdentifier === 'layOnHandsDisease') {
        let diseased = effectUtils.getEffectByStatusID(targetToken.actor, 'diseased');
        if (diseased) await genericUtils.remove(diseased);
        return;
    }
}
export let layOnHands = {
    name: 'Lay on Hands',
    aliases: ['Lay On Hands'],
    version: '1.1.2',
    midi: {
        item: [
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['layOnHandsPoison', 'layOnHandsDisease']
            },
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    },
    ddbi: {
        correctedItems: {
            'Lay on Hands Pool': {
                system: {
                    uses: {
                        prompt: false
                    }
                }
            }
        },
        renamedItems: {
            'Lay on Hands Pool': 'Lay on Hands'
        }
    }
};