import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
export async function grimHarvest({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.length === 0 || !this.damageList) return;
    let doHealing = false;
    for (let i of this.damageList) {
        if (i.oldHP != 0 && i.newHP === 0) {
            let targetToken = await fromUuid(i.tokenUuid);
            if (!targetToken) continue;
            let targetRace = chris.raceOrType(targetToken.actor);
            if (targetRace === 'undead' || targetRace === 'construct') continue;
            doHealing = true;
            break;
        }
    }
    if (!doHealing) return;
    let queueSetup = await queue.setup(this.item.uuid, 'grimHarvest', 450);
    if (!queueSetup) return;
    let spellLevel;
    let spellSchool;
    if (this.item.type === 'spell') {
        spellLevel = this.castData.castLevel;
        spellSchool = this.item.system.school;
    } else if (this.item.type === 'feat') {
        spellLevel = this.item.flags['chris-premades']?.spell?.castData?.castLevel;
        spellSchool = this.item.flags['chris-premades']?.spell?.castData?.school;
    }
    if (!spellSchool || !spellLevel) {
        queue.remove(this.item.uuid);
        return;
    }
    let effect = chris.findEffect(this.actor, 'Grim Harvest');
    if (!effect) {
        queue.remove(this.item.uuid);
        return;
    }
    let originItem = await fromUuid(effect.origin);
    if (!originItem) {
        queue.remove(this.item.uuid);
        return;
    }
    let featureData = duplicate(originItem.toObject());
    let healingFormula = spellLevel * 2;
    if (spellSchool === 'nec') healingFormula = spellLevel * 3;
    featureData.system.damage.parts = [
        [
            healingFormula + '[healing]',
            'healing'
        ]
    ];
    let feature = new CONFIG.Item.documentClass(featureData, {parent: this.actor});
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [this.token.document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
    };
    await MidiQOL.completeItemUse(feature, {}, options);
    queue.remove(this.item.uuid);
}