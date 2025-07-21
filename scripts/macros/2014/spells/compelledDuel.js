import {activityUtils, actorUtils, animationUtils, combatUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../utils.js';

async function use({workflow}) {
    if (!workflow.failedSaves.size) {
        let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let targetEffectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.CompelledDuel.Target'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                compelledDuel: {
                    sourceUuid: workflow.token.document.uuid
                }
            }
        }
    };
    effectUtils.addMacro(targetEffectData, 'midi.actor', ['compelledDuelCompelled']);
    effectUtils.addMacro(targetEffectData, 'combat', ['compelledDuelCompelled']);
    effectUtils.addMacro(targetEffectData, 'movement', ['compelledDuelCompelled']);
    let casterEffectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.CompelledDuel.Source'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: targetEffectData.duration,
        flags: {
            'chris-premades': {
                compelledDuel: {
                    targetUuids: Array.from(workflow.failedSaves).map(target => target.document.uuid)
                }
            }
        }
    };
    effectUtils.addMacro(casterEffectData, 'midi.actor', ['compelledDuelSource']);
    effectUtils.addMacro(casterEffectData, 'combat', ['compelledDuelSource']);
    let effect = await effectUtils.createEffect(workflow.actor, casterEffectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'compelledDuelSource'});
    for (let target of workflow.failedSaves) {
        await effectUtils.createEffect(target.actor, targetEffectData, {parentEntity: effect, strictlyInterdependent: true, identifier: 'compelledDuelTarget'});
    }

}
async function combatEnd({trigger: {entity: effect}}) {
    await combatUtils.setTurnCheck(effect, 'compelledDuel', true);
}
async function turnEnd({trigger}) {
    let sourceToken = trigger.token;
    let effect = trigger.entity;
    let targetUuids = effect?.flags?.['chris-premades']?.compelledDuel?.targetUuids;
    if (!targetUuids) return;
    for (let targetUuid of targetUuids) {
        let targetToken = await fromUuid(targetUuid);
        if (!targetToken || !sourceToken) continue;
        let distance = tokenUtils.getDistance(sourceToken, targetToken);
        if (distance <= genericUtils.handleMetric(30)) continue;
        let selection = await dialogUtils.confirm((await effectUtils.getOriginItem(effect))?.name, 'CHRISPREMADES.Macros.CompelledDuel.EndEffect', {userId: socketUtils.gmID()});
        if (!selection) continue;
        await genericUtils.remove(effect);
    }
}
async function targetAttack({workflow}) {
    if (workflow.targets.size !== 1) return;
    if (!constants.attacks.includes(workflow.activity.actionType)) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'compelledDuelTarget');
    if (!effect) return;
    let origin = await effectUtils.getOriginItem(effect);
    if (!origin) return;
    let targetUuid = workflow.targets.first().document.uuid;
    let sourceUuid = effect.flags['chris-premades']?.compelledDuel?.sourceUuid;
    if (targetUuid === sourceUuid || !sourceUuid) return;
    workflow.disadvantage = true;
    workflow.attackAdvAttribution.add('Disadvantage: ' + origin.name);
}
async function sourceAttack({workflow}) {
    if (!workflow.targets.size) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'compelledDuelSource');
    if (!effect) return;
    let targetUuids = effect.flags['chris-premades']?.compelledDuel?.targetUuids;
    if (!targetUuids) return;
    let endSpell = false;
    for (let target of workflow.targets) {
        if (constants.attacks.includes(workflow.activity.actionType)) {
            if (!targetUuids.includes(target.document.uuid)) {
                endSpell = true;
                break;
            }
        } else {
            let disposition = target.document.disposition;
            if (disposition !== workflow.token.document.disposition && !targetUuids.includes(target.document.uuid)) {
                endSpell = true;
                break;
            }
        }
    }
    if (!endSpell) return;
    await genericUtils.remove(effect);
}
async function targetAttacked({trigger, workflow}) {
    let targetToken = trigger.token;
    let effect = effectUtils.getEffectByIdentifier(targetToken.actor, 'compelledDuelTarget');
    if (!effect) return;
    if (targetToken.document.disposition === workflow.token.document.disposition) return;
    let sourceUuid = effect.flags['chris-premades']?.compelledDuel?.sourceUuid;
    if (workflow.token.document.uuid === sourceUuid || !sourceUuid) return;
    await genericUtils.remove(effect);
}
async function targetMoved({trigger: {entity: effect}, options}) {
    if (!effect) return;
    let token = actorUtils.getFirstToken(effect.parent);
    if (!token) return;
    if (token.scene.id !== canvas.scene.id) return;
    let sourceToken = await fromUuid(effect.flags['chris-premades']?.compelledDuel?.sourceUuid);
    if (!sourceToken) return;
    let tempToken = await token.actor.getTokenDocument({
        x: options['chris-premades']?.coords?.previous?.x ?? token.x,
        y: options['chris-premades']?.coords?.previous?.y ?? token.y,
        elevation: options['chris-premades']?.coords?.previous?.elevation ?? token.elevation,
        actorLink: false,
        hidden: true,
        delta: {ownership: token.actor.ownership}
    }, {parent: canvas.scene});
    let oldDistance = tokenUtils.getDistance(sourceToken.object, tempToken);
    let distance = tokenUtils.getDistance(sourceToken.object, token);
    if (oldDistance >= distance || distance <= genericUtils.handleMetric(30)) return;
    let turnCheck = combatUtils.perTurnCheck(effect, 'compelledDuel');
    if (!turnCheck) return;
    let feature = activityUtils.getActivityByIdentifier(await effectUtils.getOriginItem(effect), 'compelledDuelMoved', {strict: true});
    if (!feature) return;
    let originItem = await effectUtils.getOriginItem(effect);
    if (!originItem) return;
    let spellWorkflow = await workflowUtils.syntheticActivityRoll(feature, [token]);
    if (!spellWorkflow.failedSaves.size) {
        await combatUtils.setTurnCheck(effect, 'compelledDuel');
        return;
    }
    if (animationUtils.jb2aCheck()) {
        /* eslint-disable indent */
        await new Sequence()
            .effect()
                .file('jb2a.misty_step.01.blue')
                .atLocation(token)
                .randomRotation()
                .scaleToObject(2)
                .wait(750)
            .animation()
                .on(token)
                .opacity(0.0)
                .teleportTo({x: tempToken.x, y: tempToken.y, elevation: tempToken.elevation})
                .wait(200)
            .effect()
                .file('jb2a.misty_step.02.blue')
                .atLocation(token)
                .randomRotation()
                .scaleToObject(2)
                .wait(1500)
            .animation()
                .on(token)
                .opacity(1.0)
            .play();
        /* eslint-enable indent */
    } else {
        await new Sequence()
            .animation()
            .on(token)
            .teleportTo({x: tempToken.x, y: tempToken.y, elevation: tempToken.elevation})
            .play();
    }
}
export let compelledDuel = {
    name: 'Compelled Duel',
    version: '1.2.28',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['compelledDuel']
            }
        ]
    }
};
export let compelledDuelCompelled = {
    name: 'Compelled Duel: Compelled',
    version: compelledDuel.version,
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: targetAttack,
                priority: 50
            },
            {
                pass: 'targetApplyDamage',
                macro: targetAttacked,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'combatEnd',
            macro: combatEnd,
            priority: 50
        }
    ],
    movement: [
        {
            pass: 'moved',
            macro: targetMoved,
            priority: 50
        }
    ]
};
export let compelledDuelSource = {
    name: 'Compelled Duel: Source',
    version: compelledDuel.version,
    midi: {
        actor: [
            {
                pass: 'postAttackRoll',
                macro: sourceAttack,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'turnEnd',
            macro: turnEnd,
            priority: 50
        }
    ]
};