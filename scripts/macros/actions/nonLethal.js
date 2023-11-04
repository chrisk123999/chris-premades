import {chris} from '../../helperFunctions.js';
export async function nonLethal({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let validTypes = [
        'mwak',
        'msak'
    ];
    if (!validTypes.includes(workflow.item.system.actionType)) return;
    let targetActor = workflow.targets.first().actor;
    let effect = chris.findEffect(targetActor, 'Dead');
    if (!effect) return;
    if (!workflow.damageList.length) return;
    if (workflow.damageList[0].newHP != 0 || workflow.damageList[0].oldHP === 0) return;
    await chris.removeCondition(targetActor, 'Dead');
    await chris.addCondition(targetActor, 'Unconscious', true);
}