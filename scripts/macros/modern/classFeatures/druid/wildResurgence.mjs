import {actorUtils, Logging} from '../../../../proxy.mjs';
async function early({document, activity}) {
    const identifier = activity?.identifier;
    if (identifier === 'restore-wild-shape') {
        const wildShape = actorUtils.getItemByIdentifier(document.actor, 'wild-shape');
        if (wildShape?.system.uses.value === 0) return;
        Logging.addMacroWarning('CPR', 'wild-resurgence', 'CHRISPREMADES.Macros.Modern.WildResurgence.WildShapeUses', {notify: 'info'});
        return true;
    }
    if (identifier === 'restore-spell-slot') {
        const spells = document.actor.system.spells ?? {};
        if (Object.values(spells).some(i => i.max > 0 && i.value < i.max)) return;
        Logging.addMacroWarning('CPR', 'wild-resurgence', 'CHRISPREMADES.Macros.Modern.WildResurgence.NoSpellSlots', {notify: 'info'});
        return true;
    }
}
export const wildResurgence = {
    name: 'Wild Resurgence',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {
            pass: 'itemPreTargeting',
            macro: early,
            priority: 50
        }
    ]
};
