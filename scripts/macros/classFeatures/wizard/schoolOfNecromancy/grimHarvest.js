import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
export async function grimHarvest({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.length === 0 || !workflow.damageList) return;
    let doHealing = false;
    for (let i of workflow.damageList) {
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
    let queueSetup = await queue.setup(workflow.item.uuid, 'grimHarvest', 450);
    if (!queueSetup) return;
    let spellLevel;
    let spellSchool;
    if (workflow.item.type === 'spell') {
        spellLevel = workflow.castData.castLevel;
        spellSchool = workflow.item.system.school;
    } else if (workflow.item.type === 'feat') {
        spellLevel = workflow.item.flags['chris-premades']?.spell?.castData?.castLevel;
        spellSchool = workflow.item.flags['chris-premades']?.spell?.castData?.school;
    }
    if (!spellSchool || !spellLevel) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let effect = chris.findEffect(workflow.actor, 'Grim Harvest');
    if (!effect) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let originItem = await fromUuid(effect.origin);
    if (!originItem) {
        queue.remove(workflow.item.uuid);
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
    let feature = new CONFIG.Item.documentClass(featureData, {parent: workflow.actor});
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [workflow.token.document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeQuantity': false,
        'consumeUsage': false,
        'consumeSlot': false,
        'workflowOptions': {
            'autoRollDamage': 'always',
            'autoFastDamage': true
        }
    };
    await MidiQOL.completeItemUse(feature, {}, options);
    queue.remove(workflow.item.uuid);
}