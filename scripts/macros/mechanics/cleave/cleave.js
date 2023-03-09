import {chris} from '../../../helperFunctions.js';
export async function cleave(workflow) {
    if (workflow.hitTargets.size != 1 || workflow.item.system.actionType != 'mwak' || !workflow.damageList) return;
    let newHP = workflow.damageList[0].newHP;
    if (newHP != 0) return;
    let oldHP = workflow.damageList[0].oldHP;
    let leftoverDamage = workflow.damageList[0].appliedDamage - (oldHP - newHP);
    if (leftoverDamage === 0) return;
    let sourceNearbyTargets = chris.findNearby(workflow.token, 5, 'enemy');
    let targetNearbyTargets = chris.findNearby(workflow.targets.first(), 5, 'ally');
    if (sourceNearbyTargets.length === 0 || targetNearbyTargets.length === 0) return;
    let overlappingTargets = targetNearbyTargets.filter(function (obj) {
        return sourceNearbyTargets.indexOf(obj) !== -1;
    });
    if (overlappingTargets.length === 0) return;
    let buttons = [
        {
            'label': 'Yes',
            'value': true
        }, {
            'label': 'No',
            'value': false
        }
    ];
    let selection = await chris.selectTarget('Cleave nearby target?', buttons, overlappingTargets, true);
    if (selection.buttons === false) return;
    let targetTokenID = selection.inputs.find(id => id != false);
    if (!targetTokenID) return;
    let weaponData = duplicate(workflow.item.toObject());
    delete(weaponData.effects);
    delete(weaponData._id);
    weaponData.flags['midi-qol'].onUseMacroName = '[preCheckHits]ItemMacro';
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
            'command': `let roll = await new Roll('` + workflow.attackTotal + `').evaluate({async: true});\nthis.setAttackRoll(roll);`,
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
    let weaponAttack = new CONFIG.Item.documentClass(weaponData, {parent: workflow.actor});
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [targetTokenID],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
    };
    await MidiQOL.completeItemUse(weaponAttack, {}, options);
}