import {automationUtils, constants, dataUtils, documentUtils, effectUtils, genericUtils, Logging, rollUtils, workflowUtils} from '../../../../../proxy.mjs';
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
async function attack({document: item, macroClass: {identifier, source}, workflow}) {
    if (workflow.item.type !== 'weapon' || !workflow.hitTargets.size) return;
    if (!workflowUtils.isAttackType(workflow, 'meleeWeaponAttack'))
        return Logging.addMacroWarning(source, identifier, `Battering Roots exited early, not a melee weapon attack. (type) ${workflow.item.system.type.value}`);
    const config = automationUtils.getConfigValues(item, ['masteries', 'properties']);
    if (config.properties.length && !config.properties.some(p => workflow.item.system.properties.has(p)))
        return Logging.addMacroWarning(source, identifier, `Battering Roots exited early, no matching weapon properties. (props) ${Array.from(workflow.item.system.properties).join(', ')} (expected) ${config.properties.join(', ')}`);
    const unused = config.masteries.filter(m => m !== workflow.attackRoll.options.mastery);
    if (!unused.length) return Logging.addMacroWarning(source, identifier, `Battering Roots exited early without any mastery options. (used) ${workflow.attackRoll.options.mastery} (options) ${config.masteries.join(', ')}`);
    console.log('BATTERING ROOTS OPTIONS', unused);
    // TODO mastery system
}
export const batteringRoots = {
    name: 'Battering Roots',
    version: '2.1.3',
    rules: '2024',
    combat: [
        {
            pass: 'actorCombatStart',
            macro: combat,
            priority: 200
        }
    ],
    roll: [
        {
            pass: 'actorRollFinished',
            macro: attack,
            priority:250
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
