import {Teleport} from '../../../../../lib/teleport.js';
import {effectUtils, itemUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    let duplicityEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'invokeDuplicity');
    if (!duplicityEffect) return;
    let feature = itemUtils.getItemByIdentifier(workflow.actor, 'invokeDuplicity');
    if (!feature) return;
    let duplicityToken = workflow.token.document.parent.tokens.get(duplicityEffect.flags['chris-premades'].summons.ids[feature.name][0]).object;
    if (!duplicityToken) return;
    let origPos = workflow.token.center;
    let newPos = duplicityToken.center;
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let origTeleport = new Teleport([workflow.token], workflow.token, {animation: playAnimation ? 'mistyStep' : 'none'});
    let newTeleport = new Teleport([duplicityToken], duplicityToken, {animation: playAnimation ? 'mistyStep' : 'none'});
    origTeleport.template = {
        direction: 0,
        x: newPos.x,
        y: newPos.y
    };
    newTeleport.template = {
        direction: 0,
        x: origPos.x,
        y: origPos.y
    };
    await Promise.all([origTeleport._move(), newTeleport._move()]);
}
export let trickstersTransposition = {
    name: 'Trickster\'s Transposition',
    version: '1.3.20',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayTeleportAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        }
    ]
};