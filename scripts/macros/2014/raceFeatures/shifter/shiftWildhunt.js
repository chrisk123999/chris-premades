import {actorUtils, effectUtils, genericUtils, itemUtils, tokenUtils} from '../../../../utils.js';

async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        changes: [
            {
                key: 'flags.midi-qol.advantage.ability.check.wis',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                shiftWildhunt: {
                    originalAvatarImg: workflow.actor.img,
                    originalPrototypeImg: workflow.actor.prototypeToken.texture.src,
                    originalTokenImg: workflow.token.document.texture.src
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['shiftWildhunt']);
    effectUtils.addMacro(effectData, 'effect', ['shiftWildhunt']);
    let updates = {
        actor: {},
        token: {}
    };
    let avatarImg = itemUtils.getConfig(workflow.item, 'avatar');
    let tokenImg = itemUtils.getConfig(workflow.item, 'token');
    if (avatarImg) {
        genericUtils.setProperty(updates.actor, 'img', avatarImg);
    }
    if (tokenImg) {
        genericUtils.setProperty(updates.actor, 'prototypeToken.texture.src', tokenImg);
        genericUtils.setProperty(updates.token, 'texture.src', tokenImg);
    }
}
async function early({trigger: {entity: effect}, workflow}) {
    if (!workflow.advantage) return;
    let actor = effect.parent;
    let targetToken = workflow.targets.find(i => i.actor === actor);
    if (!targetToken) return;
    if (tokenUtils.getDistance(workflow.token, targetToken) > genericUtils.handleMetric(30)) return;
    workflow.advantage = false;
    workflow.rollOptions.advantage = false;
    workflow.flankingAdvantage = false;
    workflow.attackAdvAttribution.add(effect.name);
}
async function end({trigger: {entity: effect}}) {
    let {originalAvatarImg, originalPrototypeImg, originalTokenImg} = effect.flags['chris-premades'].shifterWildhunt;
    let actor = effect.parent;
    let token = actorUtils.getFirstToken(actor)?.document;
    if (!actor) return;
    let currAvatarImg = actor.img;
    let currPrototypeImg = actor.prototypeToken.texture.src;
    let currTokenImg = token?.texture.src;
    let updates = {
        actor: {},
        token: {}
    };
    if (currAvatarImg !== originalAvatarImg) genericUtils.setProperty(updates.actor, 'img', originalAvatarImg);
    if (currPrototypeImg !== originalPrototypeImg) genericUtils.setProperty(updates.actor, 'prototypeToken.texture.src', originalPrototypeImg);
    if (currTokenImg !== originalTokenImg) genericUtils.setProperty(updates.token, 'texture.src', originalTokenImg);
    if (Object.entries(updates.actor)?.length) {
        await genericUtils.update(actor, updates.actor);
    }
    if (token && Object.entries(updates.token)?.length) {
        await genericUtils.update(token, updates.token);
    }
}
export let shiftWildhunt = {
    name: 'Shift: Wildhunt',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'targetPreambleComplete',
                macro: early,
                priority: 50
            }
        ]
    },
    effect: [
        {
            pass: 'deleted',
            macro: end,
            priority: 50
        }
    ],
    config: [
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.Shifter',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.Shifter',
            type: 'file',
            default: '',
            category: 'visuals'
        }
    ]
};