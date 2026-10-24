import {actorUtils, automationUtils, compendiumUtils, constants, documentUtils, itemUtils, Logging, workflowUtils} from '../../../../../proxy.mjs';
import {default as cpr} from '../../../../../constants.mjs';
function log(source, identifier, msg, notify) {
    Logging.addMacroWarning(source, identifier, msg, {notify});
    return true;
}
async function rageBegin({document: activity}) {
    if (activity.item.system.uses.spent) await documentUtils.update(activity.item, {'system.uses.spent': 0});
}
async function preCheck({actor, macroClass: {identifier, source}}) {
    if (!actor.flags[source]?.raging)
        return log(source, identifier, 'CHRISPREMADES.Macros.Modern.BranchesOfTheTree.Rage', true);
}
async function fist({document: activity, macroClass: {identifier, source}, token}) {
    let strike = actorUtils.getItemByIdentifier(activity.actor, 'unarmed-strike', {type: 'weapon'});
    if (!strike) {
        const pack = documentUtils.getRules(activity.item) === '2024' ? cpr.packs.modern.misc : cpr.packs.legacy.misc;
        strike = await compendiumUtils.getDocumentByIdentifier(pack, 'unarmed-strike');
    }
    if (!strike) return log(source, identifier, `I Cast Fist exited early without locating an unarmed strike item. (actor) ${activity.actor.uuid}`);
    const attack = itemUtils.getActivityByIdentifier(strike, 'unarmed-strike');
    if (!attack) return log(source, identifier, `I Cast Fist exited early without locating the unarmed strike attack activity. (item) ${strike.uuid} (identifier) unarmed-strike`);
    const config = automationUtils.getConfigValues(activity.item, Object.keys(iCastFist.config));
    const castFist = attack.toObject();
    castFist.damage.parts = [{custom: {enabled: true, formula: config.damage}, types: [config.damageType]}];
    castFist.midiProperties.identifier = 'iCastFist';
    castFist.damage.includeBase = false;
    castFist.name = activity.item.name;
    castFist.img = activity.item.img;
    castFist.target.override = true;
    const item = strike.toObject();
    item.system.activities[castFist._id] = castFist;
    const roll = await workflowUtils.syntheticItemDataRoll(item, activity.actor, [], {options: {activityIdentifier: castFist.midiProperties.identifier, advantage: true}});
    if (!roll?.hitTargets.size) return log(source, identifier, 'I Cast Fist exited early with no hit targets.');
    await Promise.all(roll.hitTargets.map(t => 
        actorUtils.getSize(t.actor) <= CONFIG.DND5E.actorSizes[config.size]?.numerical ? 
            actorUtils.applyConditions(t.actor, ['prone']) : undefined
    ));
}
export const iCastFist = {
    name: 'I Cast Fist',
    version: '2.1.3',
    rules: '2024',
    called: [
        {
            pass: 'actorRageBegin',
            macro: rageBegin,
            priority: 200
        }
    ],
    roll: [
        {
            pass: 'activityPreTargeting',
            macro: preCheck,
            priority: 50
        },
        {
            pass: 'activityPreambleComplete',
            macro: fist,
            priority: 50
        }
    ],
    config: {
        damage: {
            default: '6d6 + @mod',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'behavior'
        },
        damageType: {
            default: 'bludgeoning',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageType',
            get options() { return constants.damageTypeOptions; }
        },
        size: {
            default: 'huge',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.MaxSize',
            get options() { return constants.sizeOptions; }
        }
    }
};
