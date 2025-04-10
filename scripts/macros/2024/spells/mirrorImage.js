import {effectUtils, genericUtils, itemUtils, tokenUtils} from '../../../utils.js';
async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'macro.tokenMagic',
                mode: 0,
                value: 'images',
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                mirrorImage: {
                    images: 3
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['mirrorImageMirrored']);
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'mirrorImage', rules: 'modern'});
}
async function attacked({trigger: {entity: effect}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (workflow.isFumble) return;
    let targetToken = workflow.hitTargets.first();
    let attackingToken = workflow.token;
    if (!tokenUtils.canSee(attackingToken, targetToken)) return;
    if (tokenUtils.canSense(attackingToken, targetToken, ['blindsight', 'seeAll'])) return;
    let duplicates = effect.flags['chris-premades'].mirrorImage.images;
    if (!duplicates) return;
    let rollExpression = duplicates + 'd6cs>=3';
    let roll = await new Roll(rollExpression).evaluate();
    roll.toMessage({
        rollMode: 'roll',
        speaker: ChatMessage.implementation.getSpeaker({token: targetToken}),
        flavor: effect.name
    });
    let hitsDuplicate = roll.total;
    if (!hitsDuplicate) return;
    workflow.hitTargets.delete(targetToken);
    ChatMessage.create({
        speaker: workflow.chatCard.speaker,
        content: genericUtils.translate('CHRISPREMADES.Macros.MirrorImage.Hit')
    });
    if (duplicates === 1) {
        await genericUtils.remove(effect);
    } else {
        await genericUtils.setFlag(effect, 'chris-premades', 'mirrorImage.images', duplicates - 1);
        if (globalThis.TokenMagic?.hasFilterId(targetToken, 'images')) {
            await globalThis.TokenMagic.updateFiltersByPlaceable(targetToken, [{
                filterId: 'images',
                filterType: 'images',
                nbImage: duplicates
            }]);
        }
    }
}
export let mirrorImage = {
    name: 'Mirror Image',
    version: '1.2.30',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};
export let mirrorImageMirrored = {
    name: 'Mirror Image: Mirrored',
    version: mirrorImage.version,
    rules: mirrorImage.rules,
    midi: {
        actor: [
            {
                pass: 'targetAttackRollComplete',
                macro: attacked,
                priority: 50
            }
        ]
    }
};