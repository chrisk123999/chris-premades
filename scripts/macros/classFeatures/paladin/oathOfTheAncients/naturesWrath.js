import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
export async function naturesWrath({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.targets.size) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'naturesWrath', 50);
    if (!queueSetup) return;
    let user = chris.firstOwner(workflow.targets.first());
    await chris.thirdPartyReactionMessage(user, true, 'naturesWrath');
    let selection = await chris.remoteDialog(workflow.item.name, [['Strength', 'str'], ['Dexterity', 'dex']], user.id, 'Which ability will you make the save with?');
    if (!selection) selection = 'dex';
    await chris.clearThirdPartyReactionMessage('naturesWrath');
    if (selection === 'str') {
        queue.remove(workflow.item.uuid);
        return;
    }
    let featureData = workflow.item.toObject();
    featureData.effects[0].changes[1].value = 'turn=end, saveAbility=dex, saveDC=$chris.itemDC, name=' + workflow.item.name + ' (End of Turn)';
    featureData.system.save.ability = 'dex';
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    feature.prepareData();
    feature.prepareFinalAttributes();
    workflow.item = feature;
    queue.remove(workflow.item.uuid);
}