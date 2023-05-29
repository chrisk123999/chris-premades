export async function deadlyLeap({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size === 0) return;
    let dexSaves = [];
    let strSaves = [];
    for (let targetToken of workflow.targets.values()) {
        let targetActor = targetToken.actor;
        if (targetActor.system.abilities.dex.save >= targetActor.system.abilities.str.save) {
            dexSaves.push(targetToken.document.uuid);
        } else {
            strSaves.push(targetToken.document.uuid);
        }
    }
    let areaFeatureData = duplicate(workflow.item.toObject());
    delete(areaFeatureData.effects);
    delete(areaFeatureData._id);
    delete(areaFeatureData.flags['midi-qol'].onUseMacroName);
    delete(areaFeatureData.flags['midi-qol'].onUseMacroParts);
    delete(areaFeatureData.flags.itemacro);
    areaFeatureData.system.actionType = 'save';
    areaFeatureData.name = workflow.item.name + ': Dexterity';
    areaFeatureData.system.damage.parts = [
        ['3d6[bludgeoning] + 4', 'bludgeoning'],
        ['3d6[slashing] + 4', 'slashing']
    ];
    areaFeatureData.system.save = {
        'ability': 'dex',
        'dc': 16,
        'scaling': 'flat'
    };
    areaFeatureData.system.description.value = '';
    areaFeatureData.effects = [
        {
            'changes': [
                {
                    'key': 'macro.CE',
                    'mode': 0,
                    'priority': 20,
                    'value': 'Prone'
                }
            ],
            'icon': workflow.item.img,
            'label': workflow.item.name,
            'transfer': false
        }
    ];
    let areaFeatureData2 = duplicate(areaFeatureData);
    areaFeatureData2.name = workflow.item.name + ': Strength';
    areaFeatureData2.system.save.ability = 'str';
    let areaFeature = new CONFIG.Item.documentClass(areaFeatureData, {parent: workflow.actor});
    let areaFeature2 = new CONFIG.Item.documentClass(areaFeatureData2, {parent: workflow.actor});
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': dexSaves,
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
        'workflowOptions': {
            'autoRollDamage': 'always',
            'autoFastDamage': true
        }
    };
    if (dexSaves.length > 0) await MidiQOL.completeItemUse(areaFeature, {}, options);
    options.targetUuids = strSaves;
    if (strSaves.length > 0) await MidiQOL.completeItemUse(areaFeature2, {}, options);
}