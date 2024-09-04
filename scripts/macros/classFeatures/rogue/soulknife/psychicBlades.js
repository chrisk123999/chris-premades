import {actorUtils, combatUtils, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';

async function early({workflow}) {
    if (!workflow.targets.size || !workflow.token) return;
    let str = workflow.actor.system.abilities.str.mod;
    let dex = workflow.actor.system.abilities.dex.mod;
    let ability = dex > str ? 'dex' : 'str';
    let type = (tokenUtils.getDistance(workflow.token, workflow.targets.first()) > 5) ? 'rwak' : 'mwak';
    await genericUtils.setFlag(workflow.item, 'chris-premades', 'homingStrikes.used', false);
    await genericUtils.setFlag(workflow.item, 'chris-premades', 'rendMind.prompt', false);
    workflow.item = workflow.item.clone({'system.actionType': type, 'system.ability': ability}, {keepId: true});
    workflow.item.prepareData();
    workflow.item.prepareFinalAttributes();
    workflow.item.applyActiveEffects();
}
async function late({workflow}) {
    let psionicEnergy = itemUtils.getItemByIdentifier(workflow.actor, 'psionicEnergy');
    let trueItem = itemUtils.getItemByIdentifier(workflow.actor, 'psychicBlades');
    if (trueItem?.flags['chris-premades']?.homingStrikes?.used) {
        if (workflow.hitTargets.size && psionicEnergy) await genericUtils.update(psionicEnergy, {'system.uses.value': psionicEnergy.system.uses.value - 1});
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
                if (selection) await genericUtils.update(rendMind, {'system.uses.value': 0});
            } else if (psionicEnergyUses >= 3) {
                selection = await dialogUtils.confirm(rendMind.name, genericUtils.format('CHRISPREMADES.Dialog.UseExtraCost', {itemName: rendMind.name, quantity: '3', quantityName: psionicEnergy.name}));
                if (selection) await genericUtils.update(psionicEnergy, {'system.uses.value': psionicEnergyUses - 3});
            }
            if (selection) await workflowUtils.syntheticItemRoll(rendMind, [workflow.targets.first()]);
        }
        await genericUtils.setFlag(workflow.item, 'chris-premades', 'rendMind.prompt', false);
    }
    if (!combatUtils.inCombat()) return;
    if (actorUtils.hasUsedBonusAction(workflow.actor)) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'psychicBladesBonus');
    if (effect) {
        if (genericUtils.getIdentifier(workflow.item) === 'psychicBladesBonus') await genericUtils.remove(effect);
        return;
    }
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
    let feature = itemUtils.getItemByIdentifier(workflow.actor, 'psychicBlades');
    if (!feature) return;
    let featureData = genericUtils.duplicate(feature.toObject());
    delete featureData._id;
    featureData.system.damage.parts[0][0] = '1d4[psychic] + @mod';
    featureData.system.activation.type = 'bonus';
    featureData.name += ' (' + genericUtils.translate('DND5E.BonusAction') + ')';
    effect = await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'psychicBladesBonus', vae: [{type: 'use', name: featureData.name, identifier: 'psychicBladesBonus'}]});
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: effect, identifier: 'psychicBladesBonus'});
}
async function attack({workflow}) {
    if (workflow.isFumble) return;
    let homingFeature = itemUtils.getItemByIdentifier(workflow.actor, 'homingStrikes');
    let psionicEnergy = itemUtils.getItemByIdentifier(workflow.actor, 'psionicEnergy');
    if (!homingFeature || !psionicEnergy || !workflow.targets.size) return;
    if (!psionicEnergy.system.uses.value) return;
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
    version: '0.12.54',
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
                priority: 50
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