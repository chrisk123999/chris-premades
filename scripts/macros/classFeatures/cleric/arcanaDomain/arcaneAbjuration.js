import {actorUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils} from '../../../../utils.js';
import {banishmentHelper} from '../../../spells/banishment.js';

async function early({workflow}) {
    if (!workflow.targets.size) return;
    let validTypes = ['celestial', 'elemental', 'fey', 'fiend'];
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.GenericEffects.InvalidTarget'),
        img: constants.tempConditionIcon,
        origin: workflow.item.uuid,
        duration: {
            turns: 1
        },
        changes: [
            {
                key: 'flags.midi-qol.min.ability.save.all',
                value: 99,
                mode: 5,
                priority: 120
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    'isSave'
                ]
            },
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    for (let i of workflow.targets) {
        if (!validTypes.includes(actorUtils.typeOrRace(i.actor))) await effectUtils.createEffect(i.actor, effectData);
    }
}
async function use({workflow}) {
    if (workflow.failedSaves.size !== 1) return;
    let classLevels = workflow.actor.classes.cleric?.system?.levels ?? 0;
    let target = workflow.targets.first();
    if (classLevels >= 5) {
        let maxCR = workflow.actor.system.scale.cleric?.['destroy-undead'];
        if (!maxCR) maxCR = Math.clamp(Math.floor((classLevels - 5) / 3), 0.5, 4);
        let CR = actorUtils.getLevelOrCR(target.actor);
        if (CR <= maxCR) {
            let selection = await dialogUtils.confirm(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.ArcaneAbjuration.Plane', {name: target.name}), {userId: socketUtils.gmID()});
            if (selection) {
                await banishmentHelper(workflow);
                return;
            }
        }
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        flags: {
            dae: {
                specialDuration: [
                    'isDamaged'
                ]
            },
            'chris-premades': {
                conditions: ['reaction']
            }
        }
    };
    effectUtils.addMacro(effectData, 'combat', ['noReactions']);
    await effectUtils.createEffect(target.actor, effectData);
}
export let arcaneAbjuration = {
    name: 'Channel Divinity: Arcane Abjuration',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};