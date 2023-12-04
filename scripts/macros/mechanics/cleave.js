import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
export async function cleave(workflow) {
    if (workflow.hitTargets.size != 1 || workflow.item?.system?.actionType != 'mwak' || !workflow.damageList || !workflow.item) return;
    let newHP = workflow.damageList[0].newHP;
    if (newHP != 0) return;
    if (workflow.targets.first().actor.items.getName('Minion')) return;
    let oldHP = workflow.damageList[0].oldHP;
    let leftoverDamage = workflow.damageList[0].appliedDamage - (oldHP - newHP);
    if (leftoverDamage === 0) return;
    let nearbyTargets = chris.findNearby(workflow.token, workflow.item.system.range.value ?? 5, 'enemy');
    if (nearbyTargets.length === 0) return;
    let selection = await chris.selectTarget('Cleave', constants.yesNoButton, nearbyTargets, true, 'one', false, false, 'Cleave a nearby target?');
    if (selection.buttons === false) return;
    let targetTokenID = selection.inputs.find(i => i);
    if (!targetTokenID) return;
    let weaponData = duplicate(workflow.item.toObject());
    delete(weaponData.effects);
    delete(weaponData._id);
    setProperty(weaponData, 'flags.midi-qol.onUseMacroName', '[preCheckHits]ItemMacro');
    weaponData.flags['midi-qol'].onUseMacroParts = {
    'items': [
            {
                'macroName': 'ItemMacro',
                'option': 'preCheckHits'
            }
        ]
    };
    weaponData.flags.itemacro = {
        'macro': {
            'name': workflow.item.name,
            'type': 'script',
            'scope': 'global',
            'command': `let roll = await new Roll('` + workflow.attackTotal + `').evaluate({async: true});\nworkflow.setAttackRoll(roll);`,
            'author': game.userId,
            '_id': null,
            'img': 'icons/svg/dice-target.svg',
            'folder': null,
            'sort': 0,
            'ownership': {
                'default': 0
            },
            'flags': {},
            '_stats': {
                'systemId': null,
                'systemVersion': null,
                'coreVersion': null,
                'createdTime': null,
                'modifiedTime': null,
                'lastModifiedBy': null
            }
        }
    };
    if (!workflow.item.flags['chris-premades']?.mechanic?.cleave) weaponData.name = workflow.item.name + ': Cleave';
    weaponData.system.damage.parts = [[leftoverDamage + '[' + workflow.defaultDamageType + ']', workflow.defaultDamageType]];
    weaponData.system.consume.amount = 0;
    weaponData.flags['chris-premades'] = {
        'mechanic': {
            'cleave': true
        }
    };
    let weaponAttack = new CONFIG.Item.documentClass(weaponData, {'parent': workflow.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([targetTokenID]);
    await MidiQOL.completeItemUse(weaponAttack, config, options);
}