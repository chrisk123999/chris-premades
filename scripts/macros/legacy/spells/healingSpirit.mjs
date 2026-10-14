import {actorUtils, automationUtils, constants, dialogUtils, Logging, summonUtils} from '../../../proxy.mjs';
async function confirmHeal({document, config}) {
    const targetUuid = config?.midiOptions?.targetUuids?.[0];
    if (!targetUuid) return;
    const target = fromUuidSync(targetUuid, {strict: false});
    if (!target?.actor) return;
    if (automationUtils.getConfigValue(document, 'excludedCreatureTypes').includes(actorUtils.typeOrRace(target.actor))) {
        Logging.addMacroWarning('CPR', 'healing-spirit-heal', 'Healing Spirit cannot heal this creature type.');
        return true;
    }
    const selection = await dialogUtils.confirm(document.name, _loc('CHRISPREMADES.Macros.Legacy.HealingSpirit.Apply', {name: target.name, uses: document.system.uses.value}));
    if (selection) return;
    Logging.addMacroWarning('CPR', 'healing-spirit-heal', 'Healing declined.');
    return true;
}
async function vanish({document}) {
    if (document.system.uses.value > 0) return;
    const summon = summonUtils.getSummonData(document.actor);
    if (!summon) return Logging.addMacroWarning('CPR', 'healing-spirit-heal', 'Heal used up outside a summoned spirit.');
    await summonUtils.deleteSummon(summon);
}
export const healingSpiritHeal = {
    name: 'Healing Spirit: Heal',
    version: '2.1.3',
    rules: '2014',
    roll: [
        {
            pass: 'itemPreTargeting',
            macro: confirmHeal,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: vanish,
            priority: 50
        }
    ],
    config: {
        excludedCreatureTypes: {
            default: ['undead', 'construct'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.IgnoredCreatureTypes',
            category: 'homebrew',
            get options() { return constants.creatureTypeOptions; }
        }
    }
};
