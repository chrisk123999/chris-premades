import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {translate} from '../../translations.js';
import {queue} from '../../utility/queue.js';
export async function javelinOfLightning({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.item.system.uses.value || !workflow.targets.size) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'javelinOfLightning', 50);
    if (!queueSetup) return;
    let selection = await chris.dialog(workflow.item.name, constants.yesNo, 'Use ' + workflow.item.name + '?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await workflow.item.update({'system.uses.value': 0});
    let targetToken = workflow.targets.first();
    let ray = new Ray(workflow.token.center, targetToken.center);
    if (ray.distance === 0) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let templateData = {
        'angle': 0,
        'direction': Math.toDegrees(ray.angle),
        'distance': ray.distance / canvas.scene.grid.size * 5,
        'x': ray.A.x,
        'y': ray.A.y,
        't': 'ray',
        'user': game.user,
        'fillColor': game.user.color,
        'width': 5
    };
    let bonusDamageFormula = '4d6[' + translate.damageType('lightning') + ']';
    await chris.addToDamageRoll(workflow, bonusDamageFormula);
    let {template, tokens} = await chris.createTemplate(templateData, true);
    let effectData = {
        'name': workflow.item.name + ' Bolt Template',
        'icon': workflow.item.img,
        'changes': [
            {
                'key': 'flags.dae.deleteUuid',
                'mode': 5,
                'priority': 20,
                'value': template.uuid
            }
        ],
        'duration': {
            'seconds': 1
        }
    };
    new Sequence()
        .effect()
        .atLocation(workflow.token)
        .stretchTo(targetToken)
        .file('jb2a.lightning_bolt.wide.blue')
        .play();
    await chris.createEffect(workflow.actor, effectData);
    let targets = tokens.filter(i => i.uuid != workflow.token.document.uuid && i.uuid != targetToken.document.uuid);
    if (!targets.length) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Item Features', 'Javelin of Lightning - Bolt', false);
    if (!featureData) {
        queue.remove(workflow.item.uuid);
        return;
    }
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Javelin of Lightning - Bolt');
    delete featureData._id;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions(targets.map(i => i.uuid));
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(feature, config, options);
    queue.remove(workflow.item.uuid);
}