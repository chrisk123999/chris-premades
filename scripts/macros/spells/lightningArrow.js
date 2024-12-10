import {activityUtils, animationUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.cator, workflow.item);
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                castData: workflow.castData
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['lightningArrowBuffed']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'lightningArrow'});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {duration: effectData.duration});
}
async function early({workflow}) {
    if (workflow.targets.size !== 1) return;
    if (!workflow.item.system.properties.has('thr') && workflow.item.system.actionType !== 'rwak') return;
    genericUtils.setProperty(workflow, 'workflowOptions.autoRollDamage', 'always');
}
async function damage({trigger: {entity: effect}, workflow}) {
    if (activityUtils.getIdentifier(workflow.activity) === 'lightningArrowBurst') return;
    if (workflow.targets.size !== 1) return;
    if (!workflow.item.system.properties.has('thr') && workflow.item.system.actionType !== 'rwak') return;
    let targetToken = workflow.targets.first();
    let diceNumber = 1 + effect.flags['chris-premades'].castData.castLevel;
    let originItem = fromUuidSync(effect.origin);
    let feature = activityUtils.getActivityByIdentifier(originItem, 'lightningArrowBurst', {strict: true});
    if (!feature) return;
    let damageType = feature.damage.parts[0].types.first();
    let damageFormula = diceNumber + 'd8[' + damageType + '] + @mod';
    await workflowUtils.replaceDamage(workflow, damageFormula, {damageType});
    if (workflow.hitTargets.size === 0) await workflowUtils.applyDamage([targetToken], Math.floor(workflow.damageRolls[0].total / 2), damageType);
    let newTargets = tokenUtils.findNearby(targetToken, 10);
    let playAnimation = itemUtils.getConfig(originItem, 'playAnimation') && animationUtils.jb2aCheck();
    let anim = 'jb2a.chain_lightning.secondary.blue';
    if (playAnimation) {
        animationUtils.simpleAttack(workflow.token, targetToken, anim);
        for (let i of newTargets) {
            if (playAnimation) animationUtils.simpleAttack(targetToken, i, anim);
        }
    }
    if (newTargets.length) {
        await workflowUtils.syntheticActivityRoll(feature, newTargets, {atLevel: effect.flags['chris-premades'].castData.castLevel});
    }
    // TODO: If the burst causes damage to the caster & they fail conc save, this removal may result in an error when the failed save tries to remove conc
    await genericUtils.remove(effect);
}
export let lightningArrow = {
    name: 'Lightning Arrow',
    version: '1.1.0',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['lightningArrow']
            }
        ]
    },
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        }
    ]
};
export let lightningArrowBuffed = {
    name: 'Lightning Arrow: Buffed',
    version: lightningArrow.version,
    midi: {
        actor: [
            {
                pass: 'preItemRoll',
                macro: early,
                priority: 50
            },
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};