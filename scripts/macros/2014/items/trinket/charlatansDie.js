import {dialogUtils, itemUtils, rollUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    if (!itemUtils.getEquipmentState(workflow.item)) return;
    let utilityRoll = workflow.utilityRolls[0];
    let faces = utilityRoll.terms[0].faces;
    let options = [];
    for (let i = 1; i < faces + 1; i++) options.push([String(i), i]);
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.CharlatansDie.Use', options, {displayAsRows: true});
    if (!selection) return;
    let roll = await rollUtils.replaceD20(utilityRoll, Number(selection));
    await workflow.setUtilityRolls([roll]);
}
export let charlatansDie = {
    name: 'Charlatan\'s Die',
    version: '1.3.95',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'utilityRollComplete',
                macro: use,
                priority: 50
            }
        ]
    }
};