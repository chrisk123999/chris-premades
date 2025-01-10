import {actorUtils, combatUtils, effectUtils, genericUtils} from '../../utils.js';
async function use({workflow}) {
    if (!workflow.targets.size) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        changes: [
            {
                key: 'system.traits.di.value',
                mode: 2,
                value: 'healing',
                priority: 20
            }
        ],
        flags: {
            dae: {
                showIcon: true,
                specialDuration: [
                    'turnStartSource'
                ]
            }
        }
    };
    await Promise.all(workflow.hitTargets.map(async token => {
        if (actorUtils.typeOrRace(token.actor)?.toLowerCase() === 'undead') {
            let newEffect = genericUtils.duplicate(effectData);
            newEffect.name = genericUtils.translate('CHRISPREMADES.Macros.ChillTouch.Undead');
            effectUtils.addMacro(newEffect, 'midi.actor', ['chillTouchChilled']);
            effectUtils.addMacro(newEffect, 'combat', ['chillTouchChilled']);
            newEffect.flags.dae.specialDuration = ['turnEndSource'];
            await effectUtils.createEffect(token.actor, newEffect, {identifier: 'chillTouchChilled'});
        } else {
            await effectUtils.createEffect(token.actor, effectData, {identifier: 'chillTouchChilled'});
        }
    }));
}
async function attack({workflow}) {
    if (workflow.targets.size !== 1) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'chillTouchChilled');
    if (!effect) return;
    let sourceActor = (await fromUuid(effect.origin)).actor;
    if (workflow.targets.first().actor !== sourceActor) return;
    workflow.disadvantage = true;
    workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Disadvantage') + ': ' + effect.name);
}
async function turnStart({trigger: {entity: effect}}) {
    let currActor = combatUtils.getCurrentCombatantToken().actor;
    let originActor = (await fromUuid(effect.origin))?.parent;
    if (originActor !== currActor) return;
    await genericUtils.update(effect, {changes: []});
}
export let chillTouch = {
    name: 'Chill Touch',
    version: '1.1.10',
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
    },
    combat: [
        {
            pass: 'everyTurn',
            macro: turnStart,
            priority: 50
        }
    ]
};