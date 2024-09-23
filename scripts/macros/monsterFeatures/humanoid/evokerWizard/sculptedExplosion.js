import {constants, dialogUtils, effectUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function damage({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let buttons = [
        ['DND5E.DamageCold', 'cold', {image: 'icons/magic/air/wind-tornado-wall-blue.webp'}],
        ['DND5E.DamageFire', 'fire', {image: 'icons/magic/fire/beam-jet-stream-embers.webp'}],
        ['DND5E.DamageLightning', 'lightning', {image: 'icons/magic/lightning/bolt-blue.webp'}],
        ['DND5E.DamageThunder', 'thunder', {image: 'icons/magic/sonic/explosion-shock-wave-teal.webp'}]
    ];
    let damageType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Dialog.DamageType', buttons);
    if (!damageType) return;
    workflow.damageRolls[0].options.type = damageType;
    for (let term of workflow.damageRolls[0].terms) {
        if (term.options.flavor === 'none') term.options.flavor = damageType;
    }
    workflow.defaultDamageType = damageType;
    await workflow.setDamageRolls(workflow.damageRolls);
}
async function early({trigger, workflow}) {
    let max = Number(itemUtils.getConfig(workflow.item, 'maxAmount'));
    let selection = Array.from(workflow.targets.filter(i => i.document.disposition === workflow.token.document.disposition));
    if (!selection.length) return;
    if (selection.length > max) {
        selection = await dialogUtils.selectTargetDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.SculptSpells.Select', {max}), selection, {
            type: 'multiple',
            maxAmount: max,
            skipDeadAndUnconscious: false
        });
        if (!selection?.length) return;
        selection = selection[0];
    }
    let effectData = {
        name: workflow.item.name,
        img: constants.tempConditionIcon,
        origin: workflow.item.uuid,
        changes: [
            {
                key: 'flags.midi-qol.min.ability.save.all',
                mode: 5,
                value: 100,
                priority: 120
            },
            {
                key: 'flags.midi-qol.superSaver.all',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['sculptSpellsTarget']);
    for (let target of selection) {
        await effectUtils.createEffect(target.actor, effectData);
    }
}
export let sculptedExplosion = {
    name: 'Sculpted Explosion',
    version: '0.12.74',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            },
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'maxAmount',
            label: 'CHRISPREMADES.Generic.Max',
            type: 'text',
            default: 3,
            category: 'homebrew',
            homebrew: true
        }
    ],
    monster: {
        name: 'Evoker Wizard'
    }
};