import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
export async function smotherDamage(origin, token, actor) {
    let sourceTokenId = actor.flags['chris-premades']?.monster?.rugOfSmothering?.smother
    if (!sourceTokenId) return;
    if (game.combat.current.tokenId != sourceTokenId) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Monster Feature Items', 'Rug of Smothering - Smother', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Rug of Smothering - Smother');
    featureData.system.damage.parts = [
        [
            '2d6+3[bludgeoning]',
            'bludgeoning'
        ]
    ];
    featureData.system.save.dc = chris.getSpellDC(origin);
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': origin.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([token.document.uuid]);
    await MidiQOL.completeItemUse(feature, config, options);
}

export async function smother({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.hitTargets.size) return
    let targetToken = workflow.targets.first();
    if(game.modules.get('Rideable')?.active) {
        await MidiQOL.moveToken(workflow.token, {x: targetToken.x, y: targetToken.y});
        game.Rideable.Mount([targetToken.document], workflow.token.document, {'Grappled': true});
    }
}