import {chris} from '../../../helperFunctions.js';
export async function eatMemories(workflow) {
    if (workflow.failedSaves.size != 1) return;
    let diceSize = '1d4';
    let targetActor = workflow.targets.first().actor;
    let effect = chris.findEffect(targetActor,'Eat Memories');
    if (effect) {
        diceSize = effect.changes[0].value;
        switch (diceSize) {
            case '1d4':
                diceSize = '1d6';
                break;
            case '1d6':
                diceSize = '1d8';
                break;
            case '1d8':
                diceSize = '1d10';
                break;
            case '1d10':
                diceSize = '1d12';
                break;
            case '1d12':
                diceSize = '1d20';
                break;
            case '1d20':
                let condition = chris.findEffect(targetActor, 'Unconscious');
                if (!condition) await chris.addCondition(targetActor, 'Unconscious', true, workflow.item.uuid);
                return;
        }
        let changes = effect.changes;
        changes[0].value = diceSize;
        changes[1].value = '-' + diceSize;
        changes[2].value = '-' + diceSize;
        await chris.updateEffect(effect, {changes});
    } else {
        let effectData = {
            'label': workflow.item.name,
            'icon': workflow.item.img,
            'origin': workflow.item.uuid,
            'duration': {
                'seconds': 604800
            },
            'changes': [
                {
                    'key': 'flags.chris-premades.feature.eatmemories',
                    'mode': 5,
                    'value': diceSize,
                    'priority': 20
                },
                {
                    'key': 'system.bonuses.All-Attacks',
                    'mode': 2,
                    'value': '-' + diceSize,
                    'priority': 20
                },
                {
                    'key': 'system.bonuses.abilities.check',
                    'mode': 2,
                    'value': '-' + diceSize,
                    'priority': 20
                }
            ],
            'flags': {
                'dae': {
                    'transfer': false,
                    'specialDuration': [
                        'longRest',
                        'shortRest'
                    ],
                    'stackable': 'multi',
                    'macroRepeat': 'none'
                }
            }
        };
        await chris.createEffect(targetActor, effectData);
        let skillEffect = chris.findEffect(workflow.actor, workflow.item.name + ' Skills');
        let changes;
        if (skillEffect) {
            changes = skillEffect.changes;
        } else {
            changes = [];
        }
        for (let [key, value] of Object.entries(targetActor.system.skills)) {
            if (value.proficient > workflow.actor.system.skills[key].proficient) {
                changes.push({
                    'key': 'system.skills.' + key + '.value',
                    'mode': 5,
                    'value': value.proficient,
                    'priority': 20
                });
            }
        }
        for (let i of Array.from(targetActor.system.traits.languages.value)) {
            if (!workflow.actor.system.traits.languages.value.has(i)) {
                changes.push({
                    'key': 'system.traits.languages.value',
                    'mode': 2,
                    'value': i,
                    'priority': 20
                });
            }
        }
        if (!skillEffect) {
            let skillEffectData = {
                'label': workflow.item.name + ' Skills',
                'icon': 'icons/magic/symbols/circled-gem-pink.webp',
                'origin': workflow.item.uuid,
                'duration': {
                    'seconds': 2628000
                },
                'changes': changes
            }
            await chris.createEffect(workflow.actor, skillEffectData);
        } else {
            let updates = {changes};
            await chris.updateEffect(skillEffect, updates);
        }
    }
}