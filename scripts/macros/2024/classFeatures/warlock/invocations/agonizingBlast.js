import {dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    let names = new Set();
    let spells = [];
    for (let item of workflow.actor.itemTypes.spell) {
        if (item.system.level != 0) continue;
        if (names.has(item.name)) continue;
        spells.push(item);
        names.add(item.name);
    }
    let max = itemUtils.getConfig(workflow.item, 'max');
    let selection = await dialogUtils.selectDocumentsDialog(workflow.item.name, 'CHRISPREMADES.Macros.AgonizingBlast.Select', spells, {max, sortAlphabetical: true, checkbox: true});
    if (!selection) return;
    await genericUtils.setFlag(workflow.item, 'chris-premades', 'agonizingBlast.spells', selection.filter(i => i.amount).map(i => i.document.name));
}
async function damage({trigger: {entity: item}, workflow}) {
    if (!workflow.damageRolls) return;
    let name = workflow.item.name;
    let trueStrike = workflow.item.flags['chris-premades']?.trueStrike;
    if (workflow.item.type != 'spell') {
        if (trueStrike) name = trueStrike;
        else return;
    }
    let spellNames = item.flags['chris-premades']?.agonizingBlast?.spells;
    if (!spellNames) return;
    if (!spellNames.includes(name)) return;
    let formula = itemUtils.getConfig(item, 'formula');
    await workflowUtils.bonusDamage(workflow, formula);
}
export let agonizingBlast = {
    name: 'Eldritch Invocations: Agonizing Blast',
    version: '1.3.156',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 100
            }
        ]
    },
    config: [
        {
            value: 'max',
            label: 'CHRISPREMADES.Config.Max',
            type: 'number',
            default: 1,
            category: 'mechanics'
        },
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '@abilities.cha.mod',
            category: 'homebrew',
            homebrew: true
        }
    ]
};