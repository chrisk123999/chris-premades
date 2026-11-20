import {constants, dialogUtils, documentUtils} from '../../../../proxy.mjs';
async function choose({workflow}) {
    const current = workflow.item.flags.cat?.alternateAttributes?.Ability?.[0]?.restrictions?.BaseItem?.value?.[0];
    const options = constants.meleeWeaponOptions.map(option => ({...option, selected: option.value === current}));
    const weapon = await dialogUtils.selectDialog(workflow.item.name, 'CHRISPREMADES.Macros.Legacy.CombatMasteryLies.Select', {label: 'CHRISPREMADES.Config.WeaponType', name: 'weapon', options: {options}}, {sort: 'alphabetical'});
    if (!weapon) return;
    await documentUtils.update(workflow.item, {'flags.cat.alternateAttributes.Ability': [{value: ['cha'], restrictions: {BaseItem: {value: [weapon], invert: false}}}]});
}
export const combatMasteryLies = {
    name: 'Combat Mastery: Lies',
    version: '2.1.10',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: choose,
            priority: 50
        }
    ]
};
