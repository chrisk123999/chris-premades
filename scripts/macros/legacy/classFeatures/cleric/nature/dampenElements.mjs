import {activityUtils, actorUtils, automationUtils, constants, dialogUtils, Logging, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function damaged({document: activity, ditem, macroClass: {identifier, source}, targetToken}) {
    if (!ditem.isHit || !ditem.totalDamage || ditem.oldHP === 0) return;
    const damage = automationUtils.getConfigValue(activity.item, 'damage');
    const damages = ditem.calculatedDamages.filter(d => d.value > 0 && (!damage.length || damage.includes(d.type)))
        .filter(d => {
            if (!d.potential.type?.resistance && !d.active.type?.resistance) return true;
            Logging.addMacroWarning(source, identifier, `Dampen Elements skipped damage that was already resisted. (activity) ${activity.uuid} (target) ${targetToken.uuid} (damage) ${d.type}`);
        });
    const types = damages.map(d => d.type);
    if (!types.length) return;
    if (actorUtils.hasUsedReaction(activity.actor))
        return Logging.addMacroWarning(identifier, source, `Dampen Elements skipped on a character with a spent reaction. (activity) ${activity.uuid}`);
    const self = actorUtils.getFirstToken(activity.actor);
    if (!self) return Logging.addMacroWarning(source, identifier, `Dampen Elements skipped a character with no placed token. (activity) ${activity.uuid}`);
    if (tokenUtils.isEnemy(self, targetToken)) return;
    if (activity.actor.uuid !== ditem.actorUuid) {
        const range = activityUtils.getRange(activity);
        if (!tokenUtils.isWithinDistance(self, targetToken, range))
            return Logging.addMacroWarning(source, identifier, `Dampen Elements skipped a target out of range. (self) ${self.uuid} (target) ${targetToken.uuid} (range) ${range}`);
    }
    let type = types[0];
    const userId = queryUtils.firstOwner(activity.actor,  true);
    if (types.length === 1) {
        if (!await dialogUtils.confirm('COMMON.Confirm',
            _loc('CHRISPREMADES.Macros.Legacy.DampenElements', {feature: activity.item.name, type, target: targetToken.name}), {userId})
        ) return;
    } else {
        type = await dialogUtils.selectDamageType(types, 'COMMON.Confirm', _loc('CAT.Dialog.UseOn', {document: activity.item.name, target: targetToken.name}), {addNo: true, userId});
        if (!type) return;
    }
    workflowUtils.damageMultiplier(ditem, [{type, multiplier: 'resistance'}]);
    await workflowUtils.syntheticActivityRoll(activity, [targetToken]);
}
export const dampenElements = {
    name: 'Dampen Elements',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'sceneDamagePercentReductions',
            macro: damaged,
            priority: 600,
            canOverlap: true,
            thirdParty: true
        }
    ],
    config: {
        damage: {
            default: ['acid', 'cold', 'fire', 'lightning', 'thunder'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageTypes',
            get options() { return constants.damageTypeOptions; }
        }
    }
};
