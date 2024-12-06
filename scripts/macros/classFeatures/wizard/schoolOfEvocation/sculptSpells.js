import {constants, dialogUtils, effectUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function early({trigger: {entity: item}, workflow}) {
    if (!workflow.targets.size) return;
    if (workflow.item.type !== 'spell') return;
    if (workflow.item.system.school !== 'evo') return;
    if (!workflow.hasSave) return;
    let max = 1 + workflow.spellLevel;
    let allowEnemies = itemUtils.getConfig(item, 'allowEnemies');
    let selection = allowEnemies ? Array.from(workflow.targets) : Array.from(workflow.targets).filter(i => i.document.disposition === workflow.token.document.disposition);
    if (selection.length > max || allowEnemies) {
        selection = await dialogUtils.selectTargetDialog(item.name, genericUtils.format('CHRISPREMADES.Macros.SculptSpells.Select', {max}), selection, {
            type: 'multiple',
            maxAmount: max,
            skipDeadAndUnconscious: false
        });
        if (!selection?.length) return;
        selection = selection[0];
    }
    if (!selection.length) return;
    let effectData = {
        name: item.name,
        img: constants.tempConditionIcon,
        origin: item.uuid,
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
async function late({trigger: {entity: effect}}) {
    if (effect) await genericUtils.remove(effect);
}
export let sculptSpells ={
    name: 'Sculpt Spells',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'allowEnemies',
            label: 'CHRISPREMADES.Config.AllowEnemies',
            type: 'checkbox',
            category: 'mechanics',
            default: false
        }
    ]
};
export let sculptSpellsTarget = {
    name: 'Sculpt Spells: Target',
    version: sculptSpells.version,
    midi: {
        actor: [
            {
                pass: 'onHit',
                macro: late,
                priority: 50
            }
        ]
    }
};