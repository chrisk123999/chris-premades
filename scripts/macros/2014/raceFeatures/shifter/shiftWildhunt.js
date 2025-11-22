import {effectUtils, itemUtils, tokenUtils} from '../../../../utils.js';
async function use({workflow}) {
    let effectvalue = game.settings.get("dnd5e", "metricLengthUnits") ? 'checkDistance(tokenUuid, targetUuid, 9)' : 'checkDistance(tokenUuid, targetUuid, 30)';
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
            },
            {
                key: 'flags.midi-qol.grants.noAdvantage.attack.all',
                mode: 0,
                value: effectvalue,
                priority: 20
            }
        ]
    };
    await effectUtils.createEffect(workflow.actor, effectData, {
        identifier: 'shiftWildhuntEffect',
        macros: [
            {
                type: 'midi.actor',
                macros: ['shiftWildhunt']
            }
        ],
        avatarImg: itemUtils.getConfig(workflow.item, 'avatarImg'),
        tokenImg: itemUtils.getConfig(workflow.item, 'tokenImg'),
        avatarImgPriority: itemUtils.getConfig(workflow.item, 'avatarImgPriority'),
        tokenImgPriority: itemUtils.getConfig(workflow.item, 'tokenImgPriority')
    });
}
export let shiftWildhunt = {
    name: 'Shifting: Wildhunt',
    aliases: 'Shift: Wildhunt',
    version: '1.3.57',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'tokenImg',
            label: 'CHRISPREMADES.Config.TokenImg',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'tokenImgPriority',
            label: 'CHRISPREMADES.Config.TokenImgPriority',
            type: 'number',
            default: 50,
            category: 'visuals'
        },
        {
            value: 'avatarImg',
            label: 'CHRISPREMADES.Config.AvatarImg',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'avatarImgPriority',
            label: 'CHRISPREMADES.Config.AvatarImgPriority',
            type: 'number',
            default: 50,
            category: 'visuals'
        }
    ]
};