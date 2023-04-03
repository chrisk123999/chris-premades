import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
async function guardianArmor({speaker, actor, token, character, item, args}) {
    let effect = chris.findEffect(this.actor, 'Arcane Armor: Guardian Model');
    if (effect) return;
    let feature = this.actor.items.getName('Infiltrator Armor: Lightning Launcher');
    if (feature) {
        await feature.delete();
    }
    let fieldUses = this.actor.flags['chris-premades']?.feature?.defensiveField;
    if (!fieldUses) fieldUses = this.actor.system.attributes.prof;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Guardian Armor: Defensive Field', false);
    let featureData2 = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Guardian Armor: Thunder Gauntlets', false);
    if (!featureData || !featureData2) return;
    featureData.system.uses.value = fieldUses;
    featureData.system.uses.max = this.actor.system.attributes.prof;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Guardian Armor: Defensive Field');
    featureData2.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Guardian Armor: Thunder Gauntlets');
    await this.actor.createEmbeddedDocuments('Item', [featureData, featureData2]);
    let effectData = {
		'label': 'Arcane Armor: Guardian Model',
		'icon': this.item.img,
		'origin': this.item.uuid
	};
    await chris.createEffect(this.actor, effectData);
    let effect2 = chris.findEffect(this.actor, 'Arcane Armor: Infiltrator Model');
    if (effect2) await effect2.delete();
}
async function infiltratorArmor({speaker, actor, token, character, item, args}) {
    let effect = chris.findEffect(this.actor, 'Arcane Armor: Infiltrator Model');
    if (effect) return;
    let feature = this.actor.items.getName('Guardian Armor: Defensive Field');
    if (feature) {
        this.actor.setFlag('chris-premades', 'feature.defensiveField', feature.system.uses.value);
        await feature.delete();
    }
    let feature2 = this.actor.items.getName('Guardian Armor: Thunder Gauntlets');
    if (feature2) {
        await feature2.delete();
    }
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Infiltrator Armor: Lightning Launcher', false);
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Infiltrator Armor: Lightning Launcher');
    if (!featureData) return;
    await this.actor.createEmbeddedDocuments('Item', [featureData]);
    let effectData = {
		'label': 'Arcane Armor: Infiltrator Model',
		'icon': this.item.img,
		'origin': this.item.uuid,
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
    await chris.createEffect(this.actor, effectData);
    let effect2 = chris.findEffect(this.actor, 'Arcane Armor: Guardian Model');
    if (effect2) await effect2.delete();
}
async function lightningLauncher({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1 || this.isFumble) return;
    let queueSetup = await queue.setup(this.item.uuid, 'lightningLauncher', 50);
    if (!queueSetup) return;
    let doExtraDamage = chris.perTurnCheck(this.item, 'feature', 'lightningLauncher', true, this.token.id);
    if (!doExtraDamage) {
        queue.remove(this.item.uuid);
        return;
    }
    let selection = await chris.dialog('Lightning Launcher: Apply extra lightning damage?', [['Yes', true], ['No', false]]);
    if (!selection) {
        queue.remove(this.item.uuid);
        return;
    }
    if (chris.inCombat()) await this.item.setFlag('chris-premades', 'feature.lightningLauncher.turn', game.combat.round + '-' + game.combat.turn);
    let diceNumber = 1;
    if (this.isCritical) diceNumber = 2;
    let damageFormula = this.damageRoll._formula + ' + ' + diceNumber + 'd6[lightning]';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await this.setDamageRoll(damageRoll);
    queue.remove(this.item.uuid);
}
async function thunderGauntlets({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1 || this.disadvantage) return;
    let effect = chris.findEffect(this.actor, 'Thunder Gauntlets');
    if (!effect) return;
    let origin = await fromUuid(effect.origin);
    if (!origin) return;
    let originActorUuid = origin.actor.uuid;
    let targetActorUuid = this.targets.first().actor.uuid;
    if (originActorUuid === targetActorUuid) return;
    let queueSetup = await queue.setup(this.item.uuid, 'thunderGauntlets', 50);
    if (!queueSetup) return;
    this.disadvantage = true;
    this.attackAdvAttribution['Disadvantage: Thunder Gauntlets'] = true;
    queue.remove(this.item.uuid);
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