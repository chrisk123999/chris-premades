import {dialogUtils, genericUtils, itemUtils} from '../../../../utils.js';

let formulaList = [
    'formulaAether',
    'formulaAlluring',
    'formulaCelerity',
    'formulaConversant',
    'formulaCruelty',
    'formulaDeftness',
    'formulaEmbers',
    'formulaGelid',
    'formulaImpermeable',
    'formulaMobility',
    'formulaNighteye',
    'formulaPercipient',
    'formulaPotency',
    'formulaPrecision',
    'formulaRapidity',
    'formulaReconstruction',
    'formulaSagacity',
    'formulaShielded',
    'formulaUnbreakable',
    'formulaVermillion'
];
async function use({workflow}) {
    let buttons = formulaList.map(i => itemUtils.getItemByIdentifier(workflow.actor, i)).filter(j => j);
    if (!buttons.length) return;
    buttons = buttons.map(i => [i.name, genericUtils.getIdentifier(i)]);
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.Mutagencraft.Create', buttons);
    if (!selection) return;
    let feature = itemUtils.getItemByIdentifier(workflow.actor, selection);
    if (!feature) return;
    let currUses = feature.system.uses.value;
    await genericUtils.update(feature, {
        'system.uses.value': currUses + 1,
        'system.uses.max': currUses + 1
    });
}
async function rest({trigger: {entity: item}}) {
    let items = formulaList.map(i => itemUtils.getItemByIdentifier(item.actor, i)).filter(j => j?.system.uses.value);
    await Promise.all(items.map(async i => await genericUtils.update(i, {'system.uses.value': 0, 'system.uses.max': 0})));
}
export let createMutagen = {
    name: 'Mutagencraft: Create Mutagen',
    version: '0.12.64',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    rest: [
        {
            pass: 'short',
            macro: rest,
            priority: 50
        }
    ]
};