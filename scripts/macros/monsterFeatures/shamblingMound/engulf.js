import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
import {translate} from '../../../translations.js';
export async function engulf(origin, token, actor) {
    let sourceTokenId = actor.flags['chris-premades']?.monster?.shamblingMound?.engulf
    if (!sourceTokenId) return;
    if (game.combat.current.tokenId != sourceTokenId) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Monster Feature Items', 'Shambling Mound - Engulf', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Shambling Mound - Engulf');
    featureData.system.damage.parts = [
        [
            '2d8[' + translate.damageType('bludgeoning') + ']',
            'bludgeoning'
        ]
    ];
    featureData.system.save.dc = chris.getSpellDC(origin);
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': origin.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([token.document.uuid]);
    await MidiQOL.completeItemUse(feature, config, options);
}

export async function engulfGrapple({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.hitTargets.size) return
    let targetToken = workflow.targets.first();
    if (game.modules.get('Rideable')?.active) {
        let targetUpdate = {
            'token': workflow.token.document.center
        };
        let options = {
            'permanent': true,
            'name': workflow.item.name,
            'description': workflow.item.name
        };
        console.log(targetToken);
        await warpgate.mutate(targetToken.document, targetUpdate, {}, options);
        game.Rideable.Mount([targetToken.document], workflow.token.document, {'Grappled': true, 'MountingEffectsOverride': []});
    }
}