import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
async function guardianArmor({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = chris.findEffect(workflow.actor, 'Arcane Armor: Guardian Model');
    if (effect) return;
    let feature = workflow.actor.items.getName('Infiltrator Armor: Lightning Launcher');
    if (feature) {
        await feature.delete();
    }
    let fieldUses = workflow.actor.flags['chris-premades']?.feature?.defensiveField;
    if (!fieldUses) fieldUses = workflow.actor.system.attributes.prof;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Guardian Armor: Defensive Field', false);
    let featureData2 = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Guardian Armor: Thunder Gauntlets', false);
    if (!featureData || !featureData2) return;
    featureData.system.uses.value = fieldUses;
    featureData.system.uses.max = workflow.actor.system.attributes.prof;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Guardian Armor: Defensive Field');
    featureData2.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Guardian Armor: Thunder Gauntlets');
    await workflow.actor.createEmbeddedDocuments('Item', [featureData, featureData2]);
    let effectData = {
        'label': 'Arcane Armor: Guardian Model',
        'icon': workflow.item.img,
        'origin': workflow.item.uuid
    };
    await chris.createEffect(workflow.actor, effectData);
    let effect2 = chris.findEffect(workflow.actor, 'Arcane Armor: Infiltrator Model');
    if (effect2) await effect2.delete();
}
async function infiltratorArmor({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = chris.findEffect(workflow.actor, 'Arcane Armor: Infiltrator Model');
    if (effect) return;
    let feature = workflow.actor.items.getName('Guardian Armor: Defensive Field');
    if (feature) {
        workflow.actor.setFlag('chris-premades', 'feature.defensiveField', feature.system.uses.value);
        await feature.delete();
    }
    let feature2 = workflow.actor.items.getName('Guardian Armor: Thunder Gauntlets');
    if (feature2) {
        await feature2.delete();
    }
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Infiltrator Armor: Lightning Launcher', false);
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Infiltrator Armor: Lightning Launcher');
    if (!featureData) return;
    await workflow.actor.createEmbeddedDocuments('Item', [featureData]);
    let effectData = {
        'label': 'Arcane Armor: Infiltrator Model',
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'changes': [
            {
                'key': 'system.attributes.movement.walk',
                'value': '+5',
                'mode': 2,
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.advantage.skill.ste',
                'value': 1,
                'mode': 0,
                'priority': 20
            }
        ]
    };
    await chris.createEffect(workflow.actor, effectData);
    let effect2 = chris.findEffect(workflow.actor, 'Arcane Armor: Guardian Model');
    if (effect2) await effect2.delete();
}
async function lightningLauncher({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || workflow.isFumble) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'lightningLauncher', 50);
    if (!queueSetup) return;
    let doExtraDamage = chris.perTurnCheck(workflow.item, 'feature', 'lightningLauncher', true, workflow.token.id);
    if (!doExtraDamage) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let selection = await chris.dialog('Lightning Launcher: Apply extra lightning damage?', [['Yes', true], ['No', false]]);
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    if (chris.inCombat()) await workflow.item.setFlag('chris-premades', 'feature.lightningLauncher.turn', game.combat.round + '-' + game.combat.turn);
    let bonusDamageFormula = '1d6[lightning]';
    if (workflow.isCritical) bonusDamageFormula = chris.getCriticalFormula(bonusDamageFormula);
    let damageFormula = workflow.damageRoll._formula + ' + ' + bonusDamageFormula;
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}
async function thunderGauntlets({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1 || workflow.disadvantage) return;
    let effect = chris.findEffect(workflow.actor, 'Thunder Gauntlets');
    if (!effect) return;
    let origin = await fromUuid(effect.origin);
    if (!origin) return;
    let originActorUuid = origin.actor.uuid;
    let targetActorUuid = workflow.targets.first().actor.uuid;
    if (originActorUuid === targetActorUuid) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'thunderGauntlets', 50);
    if (!queueSetup) return;
    workflow.disadvantage = true;
    workflow.attackAdvAttribution.add('Disadvantage: Thunder Gauntlets');
    queue.remove(workflow.item.uuid);
}
async function longRest(actor, data) {
    if (!data.longRest) return;
    let item = actor.items.getName('Armorer');
    if (!item) return;
    if (item.type != 'subclass') return;
    actor.setFlag('chris-premades', 'feature.defensiveField', actor.system.attributes.prof);
}
export let armorModel = {
    'guardianArmor': guardianArmor,
    'infiltratorArmor': infiltratorArmor,
    'lightningLauncher': lightningLauncher,
    'thunderGauntlets': thunderGauntlets,
    'longRest': longRest
}