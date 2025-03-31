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
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'mirrorImage'});
}
async function attacked({trigger: {entity: effect}, workflow}) {
    if (workflow.targets.size !== 1) return;
    if (workflow.isFumble) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    let attackingToken = workflow.token;
    if (!tokenUtils.canSee(attackingToken, targetToken)) return;
    if (tokenUtils.canSense(attackingToken, targetToken, ['blindsight', 'seeAll'])) return;
    let duplicates = effect.flags['chris-premades'].mirrorImage.images;
    if (!duplicates) return;
    let roll = await new Roll('1d20').evaluate();
    roll.toMessage({
        rollMode: 'roll',
        speaker: ChatMessage.implementation.getSpeaker({token: targetToken}),
        flavor: effect.name
    });
    let rollTotal = roll.total;
    let rollNeeded;
    switch (duplicates) {
        case 3:
            rollNeeded = 6;
            break;
        case 2:
            rollNeeded = 8;
            break;
        default:
            rollNeeded = 11;
    }
    if (rollTotal < rollNeeded) return;
    if (workflow.hitTargets.size) workflow.hitTargets.delete(targetToken);
    let duplicateAC = 10 + targetActor.system.abilities.dex.mod;
    if (workflow.attackTotal >= duplicateAC) {
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
    } else {
        ChatMessage.create({
            speaker: workflow.chatCard.speaker,
            content: genericUtils.translate('CHRISPREMADES.Macros.MirrorImage.Miss')
        });
    }
}
export let mirrorImage = {
    name: 'Mirror Image',
    version: '1.1.0',
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