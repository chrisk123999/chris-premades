import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
async function hit(workflow) {
    if (workflow.hitTargets.size != 1 || workflow.item?.system?.actionType != 'mwak' || !workflow.damageList || !workflow.item) return;
    let newHP = workflow.damageList[0].newHP;
    if (newHP != 0) return;
    if (workflow.targets.first().actor.items.getName('Minion')) return;
    let oldHP = workflow.damageList[0].oldHP;
    let leftoverDamage = workflow.damageList[0].totalDamage - (oldHP - newHP);
    if (!leftoverDamage) return;
    let fullHealthSetting = game.settings.get('chris-premades', 'DMG Cleave Full Health');
    if (!fullHealthSetting) {
        let targetMaxHP = workflow.targets.first().actor.system.attributes.hp.max;
        if (oldHP != targetMaxHP) return;
    }
    let nearbyTargets = chris.findNearby(workflow.token, workflow.rangeDetails.range ?? 5, 'enemy');
    if (!nearbyTargets.length) return;
    let selection = await chris.selectTarget('Cleave', constants.yesNoButton, nearbyTargets, true, 'one', false, false, 'Cleave a nearby target?');
    if (!selection.buttons) return;
    let targetTokenID = selection.inputs.find(i => i);
    if (!targetTokenID) return;
    let weaponData = duplicate(workflow.item.toObject());
    delete(weaponData._id);
    if (!workflow.item.flags['chris-premades']?.mechanic?.cleave?.named) weaponData.name = workflow.item.name + ': Cleave';
    weaponData.system.damage.parts = [[leftoverDamage + '[' + workflow.defaultDamageType + ']', workflow.defaultDamageType]];
    weaponData.system.consume.amount = 0;
    weaponData.flags['chris-premades'] = {
        'mechanic': {
            'cleave': {
                'attack': workflow.attackRoll.total,
                'damage': leftoverDamage + '[' + workflow.defaultDamageType + ']',
                'named': true
            }
        }
    };
    let weaponAttack = new CONFIG.Item.documentClass(weaponData, {'parent': workflow.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([targetTokenID]);
    await MidiQOL.completeItemUse(weaponAttack, config, options);
}
async function attack(workflow) {
    let flag = workflow.item?.flags?.['chris-premades']?.mechanic?.cleave;
    if (!flag) return;
    if (!flag.attack) return;
    let roll = await new Roll(String(flag.attack)).evaluate({async: true});
    await workflow.setAttackRoll(roll);
}
async function damage(workflow) {
    if (!workflow.damageRoll) return;
    let flag = workflow.item?.flags?.['chris-premades']?.mechanic?.cleave;
    if (!flag) return;
    if (!flag.damage) return;
    let roll = await new Roll(String(flag.damage)).evaluate({async: true});
    await workflow.setDamageRoll(roll);
}
export let cleave = {
    'hit': hit,
    'attack': attack,
    'damage': damage
}