import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
import {translate} from '../../../translations.js';
export async function smotherDamage(origin, token, actor) {
    let sourceTokenId = actor.flags['chris-premades']?.monster?.rugOfSmothering?.smother
    if (!sourceTokenId) return;
    if (game.combat.current.tokenId != sourceTokenId) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Monster Feature Items', 'Rug of Smothering - Smother', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Rug of Smothering - Smother');
    featureData.system.damage.parts = [
        [
            '2d6+3[' + translate.damageType('bludgeoning') + ']',
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
    if (game.modules.get('Rideable')?.active) {
        let targetUpdate = {
            'token': {
                'x': targetToken.x,
                'y': targetToken.y
            }
        };
        let options = {
            'permanent': true,
            'name': workflow.item.name,
            'description': workflow.item.name
        };
        await warpgate.mutate(workflow.token.document, targetUpdate, {}, options);
        game.Rideable.Mount([targetToken.document], workflow.token.document, {'Grappled': true});
    }
}