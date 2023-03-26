import {chris} from '../../../helperFunctions.js';
async function targets({speaker, actor, token, character, item, args}) {
    if (this.targets.size === 0) return;
    let effectData = {
        'label': 'Turn Advantage',
        'icon': 'icons/magic/time/arrows-circling-green.webp',
        'duration': {
            'turns': 1
        },
        'changes': [
            {
                'key': 'flags.midi-qol.advantage.ability.save.wis',
                'value': '1',
                'mode': 5,
                'priority': 120
            }
        ],
        'flags': {
            'dae': {
                'transfer': false,
                'specialDuration': [
                    'isSave'
                ],
                'stackable': 'multi',
                'macroRepeat': 'none'
            }
        }
    };
    let effectData2 = {
        'label': 'Turn Immunity',
        'icon': 'icons/magic/time/arrows-circling-green.webp',
        'duration': {
            'turns': 1
        },
        'changes': [
            {
                'key': 'flags.midi-qol.min.ability.save.wis',
                'value': '100',
                'mode': 5,
                'priority': 120
            }
        ],
        'flags': {
            'dae': {
                'transfer': false,
                'specialDuration': [
                    'isSave'
                ],
                'stackable': 'multi',
                'macroRepeat': 'none'
            }
        }
    };
    let validTargets = [];
    for (let i of Array.from(this.targets)) {
        if (chris.raceOrType(i.actor) != 'undead') continue;
        if (i.actor.system.attributes.hp.value === 0) continue;
        if (i.actor.flags['chris-premades']?.feature?.turnResistance) await chris.createEffect(i.actor, effectData);
        if (i.actor.flags['chris-premades']?.feature?.turnImmunity) await chris.createEffect(i.actor, effectData2);
        validTargets.push(i.id);
    }
    chris.updateTargets(validTargets);
}
async function saves({speaker, actor, token, character, item, args}) {
    if (this.failedSaves.size === 0) return;
    let clericLevels = this.actor.classes.cleric?.system?.levels;
    if (!clericLevels) return;
    let destroyLevel;
    if (clericLevels >= 17) {
        destroyLevel = 4;
    } else if (clericLevels >= 14) {
        destroyLevel = 3;
    } else if (clericLevels >= 11) {
        destroyLevel = 2;
    } else if (clericLevels >= 8) {
        destroyLevel = 1;
    } else if (clericLevels >= 5) {
        destroyLevel = 0.5;
    }
    if (!destroyLevel) return;
    let destroyTokens = [];
    for (let i of Array.from(this.failedSaves)) {
        let CR = i.actor.system.details?.cr;
        if (!CR) continue;
        if (CR > destroyLevel) continue;
        destroyTokens.push(i);
        new Sequence().effect().atLocation(i).file('jb2a.divine_smite.target.blueyellow').play();
    }
    if (destroyTokens.length === 0) return;
    await chris.applyDamage(destroyTokens, '10000', 'none');
}
export let turnUndead = {
    'targets': targets,
    'saves': saves
}