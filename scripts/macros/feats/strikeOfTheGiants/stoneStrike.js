import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
import {translate} from '../../../translations.js';
import {queue} from '../../../utility/queue.js';
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (workflow.item.system.actionType != 'mwak') return;
    let originFeature = chris.getItem(workflow.actor, 'Strike of the Giants: Stone Strike');
    if (!originFeature) return;
    if (originFeature.system.uses.value === 0) return;
    let turnCheck = chris.perTurnCheck(originFeature, 'feat', 'stoneStrike', false, workflow.token.id);
    if (!turnCheck) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'stoneStrike', 150);
    if (!queueSetup) return;
    let selection = await chris.dialog(originFeature.name, [['Yes', true], ['No', false]], 'Use ' + originFeature.name + '?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await originFeature.update({'system.uses.value': originFeature.system.uses.value - 1});
    if (chris.inCombat()) await originFeature.setFlag('chris-premades', 'feat.stoneStrike.turn', game.combat.round + '-' + game.combat.turn);
    let damageFormula = workflow.damageRoll._formula;
    let bonusDamage = '1d6[' + translate.damageType(workflow.defaultDamageType) + ']';
    if (workflow.isCritical) bonusDamage = chris.getCriticalFormula(bonusDamage);
    let damageRoll = await new Roll(damageFormula + ' + ' + bonusDamage).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    let saveDC = Math.max(workflow.actor.system.abilities.con.dc, workflow.actor.system.abilities.str.dc);
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Feat Features', 'Strike of the Giants: Stone Strike', false);
    if (!featureData) {
        queue.remove(workflow.item.uuid);
        return;
    }
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Strike of the Giants: Stone Strike');
    featureData.system.save.dc = saveDC;
    delete featureData._id;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    feature.prepareData();
    feature.prepareFinalAttributes();
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.hitTargets.first().document.uuid]);
    await warpgate.wait(100);
    let targetWorkflow = await MidiQOL.completeItemUse(feature, config, options);
    if (targetWorkflow.failedSaves.size === 0) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let selection2 = 10;
    let targetToken = targetWorkflow.failedSaves.first();
    let knockBackFactor;
    let ray;
    let newCenter;
    let hitsWall = true;
    while (hitsWall) {
        knockBackFactor = selection2 / canvas.dimensions.distance;
        ray = new Ray(workflow.token.center, targetToken.center);
        newCenter = ray.project(1 + ((canvas.dimensions.size * knockBackFactor) / ray.distance));
        hitsWall = targetToken.checkCollision(newCenter, {origin: ray.A, type: "move", mode: "any"});
        if (hitsWall) {
            selection2 -= 5;
            if (selectio2n === 0) {
                ui.notifications.info('Target is unable to be moved!');
                queue.remove(workflow.item.uuid);
                return;
            }
        }
    }
    newCenter = canvas.grid.getSnappedPosition(newCenter.x - targetToken.w / 2, newCenter.y - targetToken.h / 2, 1);
    let targetUpdate = {
        'token': {
            'x': newCenter.x,
            'y': newCenter.y
        }
    };
    let options2 = {
        'permanent': true,
        'name': workflow.item.name,
        'description': workflow.item.name
    };
    await warpgate.mutate(targetToken.document, targetUpdate, {}, options2);
    queue.remove(workflow.item.uuid);
}
async function end(origin) {
    await origin.setFlag('chris-premades', 'feat.stoneStrike.turn', null);
}
export let stoneStrike = {
    'damage': damage,
    'end': end
}