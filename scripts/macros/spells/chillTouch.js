import {actorUtils, effectUtils, genericUtils} from '../../utils.js';
async function use({workflow}) {
    if (!workflow.targets.size) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 6 * workflow.item.system.duration.value
        },
        changes: [
            {
                key: 'system.traits.di.value',
                mode: 2,
                value: 'healing',
                priority: 20
            }
        ]
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['chillTouchChilled']);
    await Promise.all(workflow.hitTargets.map(async token => await effectUtils.createEffect(token.actor, effectData, {identifier: 'chillTouchChilled'})));
}
async function attack({workflow}) {
    if (workflow.targets.size !== 1) return;
    if (actorUtils.typeOrRace(workflow.actor)?.toLowerCase() !== 'undead') return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'chillTouchChilled');
    if (!effect) return;
    let sourceActor = (await fromUuid(effect.origin)).actor;
    if (workflow.targets.first().actor !== sourceActor) return;
    workflow.disadvantage = true;
    workflow.attackAdvAttribution.add(genericUtils.translate('CHRISPREMADES.Generic.Disadvantage') + ': ' + effect.name);
}
export let chillTouch = {
    name: 'Chill Touch',
    version: '0.12.0',
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
export let chillTouchChilled = {
    name: 'Chill Touch: Chilled',
    version: chillTouch.version,
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: attack,
                priority: 50
            }
        ]
    }
};