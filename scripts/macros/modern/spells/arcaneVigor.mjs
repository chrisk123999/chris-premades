import constants from '../../../constants.mjs';
import {actorUtils, dialogUtils, Logging, rollUtils, workflowUtils} from '../../../proxy.mjs';
async function damage({workflow}) {
    const features = constants.sangromancyFeatures.map(identifier => actorUtils.getItemByIdentifier(workflow.actor, identifier)).filter(feature => feature?.system?.uses?.value);
    const max = workflowUtils.getCastLevel(workflow) ?? workflow.item.system.level;
    const selections = await dialogUtils.selectHitDie(workflow.actor, workflow.item.name, _loc('CHRISPREMADES.Macros.Modern.ArcaneVigor.Choose'), {max, additionalItems: features});
    const {count, formula} = await actorUtils.spendHitDice(workflow.actor, selections, {roll: false});
    if (!count) {
        Logging.addMacroWarning('CPR', 'arcane-vigor', 'No hit dice spent.');
        return;
    }
    const roll = await rollUtils.damageRoll(formula + ' + @mod', workflow.activity, workflow.damageRolls[0].options);
    await workflow.setDamageRolls([roll]);
}
export const arcaneVigor = {
    name: 'Arcane Vigor',
    version: '2.1.3',
    rules: '2024',
    roll: [
        {
            pass: 'itemDamageRoll',
            macro: damage,
            priority: 50
        }
    ]
};
