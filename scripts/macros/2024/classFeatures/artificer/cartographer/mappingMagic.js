import {Teleport} from '../../../../../lib/teleport.js';
import {dialogUtils, effectUtils, genericUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';

async function portalJumpTargeting({trigger: {entity: item}, actor, token}) {
    if (actor.system.attributes.movement.speed <= 0) return true;
    let near = tokenUtils.findNearby(token, 30, 'ally').filter(t => effectUtils.getEffectByIdentifier(t.actor, 'adventurersAtlas'));
    if (!near?.length) return;
    let target;
    if (near.length === 1) target = near[0];
    else {
        target = await dialogUtils.selectTargetDialog(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), near, {minAmount: 1});
        if (!target || !target[0]) return;
        target = target[0];
    }
    genericUtils.updateTargets([target]);
}
async function portalJump({workflow}) {
    let target = workflow.targets.first();
    if (!target) return;
    await Teleport.target(workflow.token, workflow.token, {range: 5, centerpoint: target.center});
}
async function portalJumpSelf({workflow}) {
    if (workflow.actor.system.attributes.movement.speed <= 0) return;
    await Teleport.target(workflow.token, workflow.token, {range: 10});
}
export let mappingMagic = {
    name: 'Mapping Magic',
    version: '1.5.16',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'preTargeting',
                macro: portalJumpTargeting,
                priority: 50,
                activities: ['portalJump']
            },
            {
                pass: 'rollFinished',
                macro: portalJump,
                priority: 50,
                activities: ['portalJump']
            },
            {
                pass: 'rollFinished',
                macro: portalJumpSelf,
                priority: 50,
                activities: ['portalJumpSelf']
            }
        ]
    },
    ddbi: {
        correctedItems: {
            'Mapping Magic': {
                system: {
                    uses: {
                        max: 'max(@abilities.int.mod, 1)',
                        recovery: [
                            {
                                period: 'lr',
                                type: 'recoverAll'
                            }
                        ]
                    }
                }
            }
        }
    }
};
