import {actorUtils, constants, effectUtils, genericUtils, itemUtils} from '../../../utils.js';
import {upcastTargets} from '../../generic/upcastTargets.js';
async function use({trigger, workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (!workflow.failedSaves.size) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'flags.midi-qol.superSaver.all',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'system.attributes.ac.bonus',
                mode: 4,
                value: 99,
                priority: 20
            },
            {
                key: 'flags.midi-qol.min.ability.save.all',
                mode: 0,
                value: 99,
                priority: 20
            },
            {
                key: 'flags.midi-qol.grants.noCritical.all',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.neverTarget',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'macro.tokenMagic',
                mode: 0,
                value: 'spectral-body',
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                banishment: {
                    creatureTypes: itemUtils.getConfig(workflow.item, 'creatureTypes')
                }
            }
        }
    };
    await Promise.all(workflow.failedSaves.map(async token => {
        await effectUtils.createEffect(token.actor, effectData, {
            concentrationItem: workflow.item,
            identifier: 'banishmentBanished',
            rules: 'modern',
            conditions: ['incapacitated'],
            macros: [{type: 'effect', macros: ['banishmentBanished']}]
        });
    }));
}
async function remove({trigger}) {
    if (trigger.entity.duration.remaining != 0) return;
    let creatureTypes = trigger.entity.flags['chris-premades']?.banishment?.creatureTypes;
    if (!creatureTypes?.length) return;
    if (!creatureTypes.includes(actorUtils.typeOrRace(trigger.entity.parent))) return;
    let token = actorUtils.getFirstToken(trigger.entity.parent);
    if (!token) return;
    await genericUtils.update(token.document, {hidden: true});
}
export let banishment = {
    name: 'Banishment',
    version: '1.1.15',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            },
            {
                pass: 'preambleComplete',
                macro: upcastTargets.plusOne,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'creatureTypes',
            label: 'CHRISPREMADES.Config.CreatureTypes',
            type: 'select-many',
            default: ['aberration', 'celestial', 'elemental', 'fey', 'fiend'],
            options: constants.creatureTypeOptions,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let banishmentBanished = {
    name: 'Banished',
    version: banishment.version,
    rules: 'modern',
    effect: [
        {
            pass: 'deleted',
            macro: remove,
            priority: 50
        }
    ]
};