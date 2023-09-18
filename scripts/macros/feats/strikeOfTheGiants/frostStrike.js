import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
import {translate} from '../../../translations.js';
import {queue} from '../../../utility/queue.js';
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (workflow.item.system.actionType != 'mwak') return;
    let originFeature = chris.getItem(workflow.actor, 'Strike of the Giants: Frost Strike');
    if (!originFeature) return;
    if (!originFeature.system.uses.value) return;
    let turnCheck = chris.perTurnCheck(originFeature, 'feat', 'frostStrike', false, workflow.token.id);
    if (!turnCheck) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'frostStrike', 150);
    if (!queueSetup) return;
    let selection = await chris.dialog(originFeature.name, [['Yes', true], ['No', false]], 'Use ' + originFeature.name + '?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await originFeature.update({'system.uses.value': originFeature.system.uses.value - 1});
    if (chris.inCombat()) await originFeature.setFlag('chris-premades', 'feat.frostStrike.turn', game.combat.round + '-' + game.combat.turn);
    let damageFormula = workflow.damageRoll._formula;
    let bonusDamage = '1d6[' + translate.damageType('cold') + ']';
    if (workflow.isCritical) bonusDamage = chris.getCriticalFormula(bonusDamage);
    let damageRoll = await new Roll(damageFormula + ' + ' + bonusDamage).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    let saveDC = Math.max(workflow.actor.system.abilities.con.dc, workflow.actor.system.abilities.str.dc);
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Feat Features', 'Strike of the Giants: Frost Strike', false);
    if (!featureData) {
        queue.remove(workflow.item.uuid);
        return;
    }
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Strike of the Giants: Frost Strike');
    featureData.system.save.dc = saveDC;
    delete featureData._id;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    feature.prepareData();
    feature.prepareFinalAttributes();
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.hitTargets.first().document.uuid]);
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(feature, config, options);
    queue.remove(workflow.item.uuid);
}
async function end(origin) {
    await origin.setFlag('chris-premades', 'feat.frostStrike.turn', null);
}
export let frostStrike = {
    'damage': damage,
    'end': end
}