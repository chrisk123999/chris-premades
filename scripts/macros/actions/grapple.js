import {chris} from '../../helperFunctions.js';
import {translate} from '../../translations.js';
export async function grapple({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    if (chris.getSize(targetActor) > (chris.getSize(workflow.actor) + 1)) {
        ui.notifications.info('Target is too big to grapple!');
        return;
    }
    let selection = await chris.remoteDialog(workflow.item.name, [[translate.skills('acr'), 'acr'], [translate.skills('ath'), 'ath'], ['Uncontested', false]], chris.firstOwner(targetToken).id, 'How would you like to contest the grapple?');
    if (selection) {
        let sourceRoll = await workflow.actor.rollSkill('ath');
        let targetRoll = await chris.rollRequest(targetToken, 'skill', selection);
        if (targetRoll.total >= sourceRoll.total) return;
    }
    if(game.modules.get('Rideable')?.active) {
        game.Rideable.Mount([targetToken.document], workflow.token.document, {'Grappled': true})
    } else {
        await chris.addCondition(targetActor, 'Grappled', false, workflow.item.uuid);
    }
}