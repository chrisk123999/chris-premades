import {dialogUtils, genericUtils, itemUtils} from '../../../../utils.js';

async function use({workflow}) {
    let currentSeason = workflow.item.flags['chris-premades']?.eladrin?.season;
    let buttons = [
        ['CHRISPREMADES.Macros.ChangeSeason.Autumn', 'autumn', {image: 'icons/magic/nature/leaf-glow-maple-orange.webp'}],
        ['CHRISPREMADES.Macros.ChangeSeason.Winter', 'winter', {image: 'icons/magic/air/wind-weather-snow-gusts.webp'}],
        ['CHRISPREMADES.Macros.ChangeSeason.Spring', 'spring', {image: 'icons/magic/nature/leaf-glow-triple-green.webp'}],
        ['CHRISPREMADES.Macros.ChangeSeason.Summer', 'summer', {image: 'icons/magic/nature/symbol-sun-yellow.webp'}]
    ];
    let currIdx = buttons.findIndex(i => i[1] === currentSeason);
    if (currIdx >= 0) buttons.splice(currIdx, 1);
    let season = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.ChangeSeason.Select', buttons);
    if (!season) return;
    let currAvatar = itemUtils.getConfig(workflow.item, currentSeason + 'Avatar');
    let currToken = itemUtils.getConfig(workflow.item, currentSeason + 'Token');
    if (!currAvatar) await itemUtils.setConfig(workflow.item, currentSeason + 'Avatar', workflow.actor.img);
    if (!currToken) await itemUtils.setConfig(workflow.item, currentSeason + 'Token', workflow.token.document.texture.src);
    let updates = {
        actor: {},
        token: {}
    };
    let avatarImg = itemUtils.getConfig(workflow.item, season + 'Avatar');
    let tokenImg = itemUtils.getConfig(workflow.item, season + 'Token');
    if (avatarImg) {
        genericUtils.setProperty(updates.actor, 'img', avatarImg);
    }
    if (tokenImg) {
        genericUtils.setProperty(updates.actor, 'prototypeToken.texture.src', tokenImg);
        genericUtils.setProperty(updates.token, 'texture.src', tokenImg);
    }
    if (Object.entries(updates.actor)?.length) {
        await genericUtils.update(workflow.actor, updates.actor);
    }
    if (Object.entries(updates.token)?.length) {
        await genericUtils.update(workflow.token.document, updates.token);
    }
    await genericUtils.setFlag(workflow.item, 'chris-premades', 'eladrin.season', season);
    let seasonLabel = genericUtils.translate(buttons.find(i => i[1] === season)[0]);
    let chatAddition = genericUtils.format('CHRISPREMADES.Macros.ChangeSeason.Chat', {season: seasonLabel});
    let existingChatContent = workflow.chatCard.content;
    await workflow.chatCard.update({content: existingChatContent.replace('<div class="midi-results">', '<p>' + chatAddition + '</p><div class="midi-results">')});
}
export let changeSeason = {
    name: 'Change Season',
    version: '1.1.0',
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
            value: 'autumnAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Macros.ChangeSeason.Autumn',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'autumnToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Macros.ChangeSeason.Autumn',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'winterAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Macros.ChangeSeason.Winter',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'winterToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Macros.ChangeSeason.Winter',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'springAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Macros.ChangeSeason.Spring',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'springToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Macros.ChangeSeason.Spring',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'summerAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Macros.ChangeSeason.Summer',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'summerToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Macros.ChangeSeason.Summer',
            type: 'file',
            default: '',
            category: 'visuals'
        }
    ],
    ddbi: {
        additionalItems: {
            'Eladrin Season: Autumn': [
                'Change Season'
            ],
            'Eladrin Season: Winter': [
                'Change Season'
            ],
            'Eladrin Season: Spring': [
                'Change Season'
            ],
            'Eladrin Season: Summer': [
                'Change Season'
            ]
        },
        removedItems: {
            'Eladrin Season: Autumn': [
                'Fey Step (Autumn)'
            ],
            'Eladrin Season: Winter': [
                'Fey Step (Winter)'
            ],
            'Eladrin Season: Spring': [
                'Fey Step (Spring)'
            ],
            'Eladrin Season: Summer': [
                'Fey Step (Summer)'
            ]
        }
    }
};