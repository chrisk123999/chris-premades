import {activityUtils, actorUtils, combatUtils, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';

async function early({workflow}) {
    if (!workflow.targets.size || !workflow.token) return;
    let str = workflow.actor.system.abilities.str.mod;
    let dex = workflow.actor.system.abilities.dex.mod;
    let ability = dex > str ? 'dex' : 'str';
    let type = (tokenUtils.getDistance(workflow.token, workflow.targets.first()) > genericUtils.handleMetric(5)) ? 'ranged' : 'melee';
    await genericUtils.setFlag(workflow.item, 'chris-premades', 'homingStrikes.used', false);
    await genericUtils.setFlag(workflow.item, 'chris-premades', 'rendMind.prompt', false);
    workflow.activity.attack.ability = ability;
    workflow.activity.attack.type.value = type;
}
async function late({workflow}) {
    let psionicEnergy = itemUtils.getItemByIdentifier(workflow.actor, 'psionicEnergy');
    let trueItem = itemUtils.getItemByIdentifier(workflow.actor, 'psychicBlades');
    if (trueItem?.flags['chris-premades']?.homingStrikes?.used) {
        if (workflow.hitTargets.size && psionicEnergy) await genericUtils.update(psionicEnergy, {'system.uses.spent': psionicEnergy.system.uses.spent + 1});
        await genericUtils.setFlag(workflow.item, 'chris-premades', 'homingStrikes.used', false);
    }
    if (trueItem?.flags['chris-premades']?.rendMind?.prompt) {
        let rendMind = itemUtils.getItemByIdentifier(workflow.actor, 'rendMind');
        if (rendMind && psionicEnergy) {
            let rendMindUses = rendMind.system.uses.value;
            let psionicEnergyUses = psionicEnergy.system.uses.value;
            let selection;
            if (rendMindUses) {
                selection = await dialogUtils.confirm(rendMind.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: rendMind.name}));
                if (selection) await genericUtils.update(rendMind, {'system.uses.spent': rendMind.system.uses.spent + 1});
            } else if (psionicEnergyUses >= 3) {
                selection = await dialogUtils.confirm(rendMind.name, genericUtils.format('CHRISPREMADES.Dialog.UseExtraCost', {itemName: rendMind.name, quantity: '3', quantityName: psionicEnergy.name}));
                if (selection) await genericUtils.update(psionicEnergy, {'system.uses.spent': psionicEnergy.system.uses.spent + 3});
            }
            if (selection) await workflowUtils.syntheticItemRoll(rendMind, [workflow.targets.first()]);
        }
        await genericUtils.setFlag(workflow.item, 'chris-premades', 'rendMind.prompt', false);
    }
    if (!combatUtils.inCombat()) return;
    if (actorUtils.hasUsedBonusAction(workflow.actor)) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'psychicBladesBonus');
    if (effect) return;
    let effectData = {
        name: workflow.item.name + ': ' + genericUtils.translate('DND5E.BonusAction'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            turns: 1
        },
        flags: {
            dae: {
                specialDuration: [
                    'turnEndSource'
                ]
            }
        }
    };
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'psychicBladesBonus', {strict: true});
    if (!feature) return;
    effect = await effectUtils.createEffect(workflow.actor, effectData, {
        identifier: 'psychicBladesBonus', 
        vae: [{
            type: 'use', 
            name: feature.name,
            identifier: 'psychicBlades',
            activityIdentifier: 'psychicBladesBonus'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['psychicBladesBonus'],
            favorite: true
        }
    });
}
async function removeBlades({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'psychicBladesBonus');
    if (effect) await genericUtils.remove(effect);
}
async function attack({workflow}) {
    if (workflow.isFumble) return;
    let homingFeature = itemUtils.getItemByIdentifier(workflow.actor, 'homingStrikes');
    let psionicEnergy = itemUtils.getItemByIdentifier(workflow.actor, 'psionicEnergy');
    if (!homingFeature || !psionicEnergy?.system.uses.value || !workflow.targets.size) return;
    let attackTotal = workflow.attackTotal;
    let targetToken = workflow.targets.first();
    let targetAC = targetToken.actor.system.attributes.ac.value;
    if (targetAC <= attackTotal) return;
    let selection = await dialogUtils.confirm(homingFeature.name, genericUtils.format('CHRISPREMADES.Dialog.Missed', {attackTotal, itemName: homingFeature.name}));
    if (!selection) return;
    let featureWorkflow = await workflowUtils.completeItemUse(homingFeature);
    if (!featureWorkflow.damageRoll) return;
    await workflowUtils.bonusAttack(workflow, featureWorkflow.damageRoll.total);
    await genericUtils.setFlag(workflow.item, 'chris-premades', 'homingStrikes.used', true);
}
export let psychicBlades = {
    name: 'Psychic Blades',
    version: '1.1.10',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            },
            {
                pass: 'postAttackRoll',
                macro: attack,
                priority: 60
            },
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50,
                activities: ['psychicBlades']
            },
            {
                pass: 'rollFinished',
                macro: removeBlades,
                priority: 50,
                activities: ['psychicBladesBonus']
            }
        ]
    },
    ddbi: {
        removedItems: {
            Soulknife: [
                'Psychic Blades: Attack (DEX)',
                'Psychic Blades: Attack (STR)',
                'Psychic Blades: Bonus Attack (DEX)',
                'Psychic Blades: Bonus Attack (STR)'
            ]
        }
    }
};