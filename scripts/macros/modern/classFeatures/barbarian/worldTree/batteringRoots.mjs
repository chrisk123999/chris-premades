import {automationUtils, combatUtils, constants, dataUtils, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, Logging, rollUtils, workflowUtils} from '../../../../../proxy.mjs';
async function combat({document: item, macroClass: {identifier, source}}) {
    const enchant = item.effects.find(e => e.type === 'enchantment');
    if (!enchant) return Logging.addMacroWarning(source, identifier, `Battering Roots exited early due to a missing enchantment. (item) ${item.uuid}`);
    const parent = item.effects.find(e => e.type === 'base');
    if (!parent) return Logging.addMacroWarning(source, identifier, `Battering Roots exited early due to a missing effect. (item) ${item.uuid}`);
    const config = automationUtils.getConfigValues(item, Object.keys(batteringRoots.config));
    const weapons = item.actor.itemTypes.weapon.filter(w =>
        ['simpleM', 'martialM'].includes(w.system.type.value) &&
        (!config.properties.length || config.properties.some(p => w.system.properties.has(p)))
    );
    if (!weapons.length) return Logging.addMacroWarning(source, identifier, `Battering Roots exited early with no valid weapons. (props) ${config.properties.join(', ')}`);
    const createdParent = (await effectUtils.createEffects(item.actor, [parent.toObject()]))?.[0];
    if (!createdParent) return Logging.addMacroWarning(`Battering Roots failed to create a parent effect. (actor) ${item.actor.uuid} (effect) ${parent.uuid}`);
    const range = (await rollUtils.rollDice(config.range, {document: item}))?.total;
    await documentUtils.modifyBatch(weapons.map(w => {
        const data = enchant.toObject();
        delete data._id;
        data.transfer = true;
        dataUtils.setOrigin(data, item.uuid);
        genericUtils.setProperty(data, 'flags.dnd5e.dependentOn', createdParent.uuid);
        genericUtils.setProperty(data, 'changes.0.value', (w.system.range.reach || 5) + range);
        return {
            documentName: 'ActiveEffect',
            action: 'create',
            data: [data],
            parent: w
        };
    }));
}
async function mastery({document: item, macroClass: {identifier, source}, data: {workflow, masteries, hit}}) {
    if (!hit.length || !workflowUtils.isAttackType(workflow, 'meleeWeaponAttack')) return;
    const config = automationUtils.getConfigValues(item, ['masteries', 'properties']);
    if (config.properties.length && !config.properties.some(p => workflow.item.system.properties.has(p))) return;
    const unused = config.masteries.filter(m => !masteries.includes(m));
    if (!unused.length) return Logging.addMacroWarning(source, identifier, `Battering Roots exited early without any mastery options. (used) ${masteries.join(', ')} (options) ${config.masteries.join(', ')}`);
    if (!combatUtils.isOwnTurn(workflow.token)) return;
    const buttons = [...unused.map(mastery => [itemUtils.getMasteryLabel(mastery), mastery]), ['CHRISPREMADES.Config.None', false]];
    const selected = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.Modern.BatteringRoots.Select', buttons);
    if (selected) masteries.push(selected);
}
export const batteringRoots = {
    name: 'Battering Roots',
    version: '2.1.6',
    rules: '2024',
    combat: [
        {
            pass: 'actorCombatStart',
            macro: combat,
            priority: 200
        }
    ],
    called: [
        {
            pass: 'actorWeaponMastery',
            macro: mastery,
            priority: 250
        }
    ],
    config: {
        range: {
            default: '10',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Range'
        },
        masteries: {
            default: ['push', 'topple'],
            type: 'select-many',
            category: 'behavior',
            label: 'DND5E.WEAPON.Mastery.Flavor',
            get options() { return constants.masteryOptions; }
        },
        properties: {
            default: ['hvy', 'ver'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.WeaponProperties',
            get options() { return constants.itemProperties; }
        }
    }
};
