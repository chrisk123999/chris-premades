import {activityUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../utils.js';
async function use({trigger, workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'vampiricTouchAttack', {strict: true});
    if (!feature) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let healingModifier = Number(itemUtils.getConfig(workflow.item, 'healingModifier'));
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        duration: itemUtils.convertDuration(workflow.item),
        origin: workflow.item.uuid,
        flags: {
            'chris-premades': {
                castData: workflow.castData,
                vampiricTouch: {
                    healingModifier
                }
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData, {
        concentrationItem: workflow.item, 
        identifier: 'vampiricTouch', 
        strictlyInterdependent: true, 
        vae: [{
            type: 'use', 
            name: feature.name,
            identifier: 'vampiricTouch', 
            activityIdentifier: 'vampiricTouchAttack'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['vampiricTouchAttack'],
            favorite: true
        }
    });
    // TODO: looks like this doesn't happen currently
    if (game.user.targets.first() !=  workflow.token) {
        await workflowUtils.syntheticActivityRoll(feature, [game.user.targets.first()], {atLevel: workflow.castData.castLevel});
    }
}
async function late({workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let damage = workflowUtils.getTotalDamageOfType(workflow.damageDetail, workflow.targets.first().actor, workflow.item.system.damage.parts[0][1]);
    if (!damage) return;
    let healingModifier = workflow.item.flags['chris-premades']?.vampiricTouch?.healingModifier ?? 0.5;
    let healing = Math.floor(damage * healingModifier);
    await workflowUtils.applyDamage([workflow.token], healing, 'healing');
}
async function early({workflow}) {
    if (workflow.activity.tempFlag) {
        workflow.activity.tempFlag = false;
        return;
    }
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'vampiricTouch');
    if (!effect) return true;
    workflow.activity.tempFlag = true;
    genericUtils.sleep(100).then(() => workflowUtils.syntheticActivityRoll(workflow.activity, Array.from(workflow.targets), {atLevel: effect.flags['chris-premades'].castData.castLevel}));
    return true;
}
export let vampiricTouch = {
    name: 'Vampiric Touch',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['vampiricTouch']
            },
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50,
                activities: ['vampiricTouchAttack']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['vampiricTouchAttack']
            }

        ]
    },
    config: [
        {
            value: 'healingModifier',
            label: 'CHRISPREMADES.Macros.VampiricTouch.HealingModifier',
            type: 'text',
            default: '0.5',
            homebrew: true,
            category: 'homebrew'
        }
    ]
};