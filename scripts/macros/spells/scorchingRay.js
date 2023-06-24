import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
export async function scorchingRay({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size === 0) return;
    let maxRays = 3 + (workflow.castData.castLevel - 2);
    let buttons = [
        {
            'label': 'Ok',
            'value': true
        }, {
            'label': 'Cancel',
            'value': false
        }
    ];
    let targets = Array.from(workflow.targets);
    let selection = await chris.selectTarget('How many? (Max: ' + maxRays + ')', buttons, targets, true, 'number');
    if (!selection.buttons) return;
    let total = 0;
    for (let i of selection.inputs) {
        if (!isNaN(i)) total += i;
    }
    if (total > maxRays) {
        ui.notifications.info('You can\'t use that many rays!');
        return;
    }
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Scorching Ray Bolt', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Scorching Ray Bolt');
    featureData.system.ability = chris.getSpellMod(workflow.item);
    featureData.flags['chris-premades'] = {
        'spell': {
            'castData': workflow.castData
        }
    }
    featureData.flags['chris-premades'].spell.castData.school = workflow.item.system.school;
    delete featureData._id;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    let options = constants.syntheticItemWorkflowOptions([]);
    for (let i = 0; i < selection.inputs.length; i++) {
        if (isNaN(selection.inputs[i]) || selection.inputs[i] === 0) continue;
        options.targetUuids = [targets[i].document.uuid];
        new Sequence().effect().file('jb2a.scorching_ray.01.orange').atLocation(workflow.token).stretchTo(targets[i]).play();
        for (let j = 0; j < selection.inputs[i]; j++) {
            await MidiQOL.completeItemUse(feature, {}, options);
        }
    }
}