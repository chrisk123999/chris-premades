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
        let selfGM = chris.firstOwner(workflow.actor).isGM;
        let targetGM = chris.firstOwner(targetActor).isGM;
        if (game.settings.get('chris-premades', 'Use Epic Rolls') && chris.hasEpicRolls() && ((selfGM != targetGM) || (!selfGM && !targetGM))) {
            let results = await ui.EpicRolls5e.requestRoll({
                'actors': [workflow.actor.uui],
                'contestants': [targetActor.uuid],
                'type': 'skill.ath',
                'contest': 'skill.' + selection,
                'options': {
                    'showRollResults': true,
                    'autoColor': true,
                    //'hideNames': !game.settings.get('chris-premades', 'Show Names') // This breaks things?
                }
            });
            if (results.canceled || !results.success) return;
        } else {
            let sourceRoll = await workflow.actor.rollSkill('ath');
            let targetRoll = await chris.rollRequest(targetToken, 'skill', selection);
            if (targetRoll.total >= sourceRoll.total) return;
        }
    }
    if(game.modules.get('Rideable')?.active) game.Rideable.Mount([targetToken.document], workflow.token.document, {'Grappled': true, 'MountingEffectsOverride': ['Grappled']});
    await chris.addCondition(targetActor, 'Grappled', false, workflow.item.uuid);
}