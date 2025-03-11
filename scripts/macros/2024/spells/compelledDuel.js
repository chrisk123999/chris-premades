import {actorUtils, animationUtils, combatUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (!workflow.failedSaves.size) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let casterEffectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.CompelledDuel.Source'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                compelledDuel: {
                    targetUuids: Array.from(workflow.failedSaves).map(target => target.document.uuid)
                }
            }
        }
    };
    let effect = await effectUtils.createEffect(workflow.actor, casterEffectData, {
        concentrationItem: workflow.item,
        identifier: 'compelledDuelSource',
        rules: 'modern',
        macros: [
            {type: 'midi.actor', macros: ['compelledDuelSource']},
            {type: 'combat', macros: ['compelledDuelSource']}
        ]
    });
    let targetEffectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.CompelledDuel.Target'),
        img: workflow.item.img,
        origin: effect.uuid,
        duration: casterEffectData.duration,
        flags: {
            'chris-premades': {
                compelledDuel: {
                    sourceUuid: workflow.token.document.uuid
                }
            }
        }
    };
    for (let target of workflow.failedSaves) {
        await effectUtils.createEffect(target.actor, targetEffectData, {
            parentEntity: effect,
            strictlyInterdependent: true,
            identifier: 'compelledDuelTarget',
            rules: 'modern',
            macros: [
                {type: 'midi.actor', macros: ['compelledDuelCompelled']},
                {type: 'combat', macros: ['compelledDuelCompelled']},
                {type: 'movement', macros: ['compelledDuelCompelled']}
            ]
        });
    }
}
async function combatEnd({trigger: {entity: effect}}) {
    await combatUtils.setTurnCheck(effect, 'compelledDuel', true);
}
async function turnEnd({trigger: {entity: effect, token: sourceToken}}) {
    let targetUuids = effect.flags?.['chris-premades']?.compelledDuel?.targetUuids;
    if (!targetUuids) return;
    for (let targetUuid of targetUuids) {
        let targetToken = fromUuidSync(targetUuid);
        if (!targetToken || !sourceToken) continue;
        let distance = tokenUtils.getDistance(sourceToken, targetToken);
        if (distance <= 30) continue;
        let selection = await dialogUtils.confirm((await effectUtils.getOriginItem(effect))?.name, 'CHRISPREMADES.Macros.CompelledDuel.EndEffect', {userId: socketUtils.gmID()});
        if (!selection) continue;
        await genericUtils.remove(effect);
    }
}
async function targetAttack({trigger: {entity: effect}, workflow}) {
    if (workflow.targets.size !== 1) return;
    if (!constants.attacks.includes(workflow.activity.actionType)) return;
    let origin = await effectUtils.getOriginItem(effect);
    if (!origin) return;
    let targetUuid = workflow.targets.first().document.uuid;
    let sourceUuid = effect.flags['chris-premades']?.compelledDuel?.sourceUuid;
    if (targetUuid === sourceUuid || !sourceUuid) return;
    workflow.disadvantage = true;
    workflow.attackAdvAttribution.add('Disadvantage: ' + origin.name);
}
async function sourceAttack({trigger: {entity: effect}, workflow}) {
    if (!workflow.targets.size) return;
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
async function targetAttacked({trigger: {entity: effect, token: targetToken}, workflow}) {
    if (targetToken.document.disposition === workflow.token.document.disposition) return;
    let sourceUuid = effect.flags['chris-premades']?.compelledDuel?.sourceUuid;
    if (workflow.token.document.uuid === sourceUuid || !sourceUuid) return;
    await genericUtils.remove(effect);
}
async function targetMoved({trigger: {entity: effect, token}, options}) {
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
    if (oldDistance >= distance || distance <= 30) return;
    let selection = await dialogUtils.confirm(effect.name, genericUtils.format('CHRISPREMADES.Macros.BoomingBlade.WillingMove', {actorName: effect.parent.name}), {userId: socketUtils.gmID()});
    if (!selection) return;
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
    version: '1.2.21',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};
export let compelledDuelCompelled = {
    name: 'Compelled Duel: Compelled',
    version: compelledDuel.version,
    rules: compelledDuel.rules,
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
    rules: compelledDuel.rules,
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