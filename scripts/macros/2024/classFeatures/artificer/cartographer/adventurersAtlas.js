import {actorUtils, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function makeMaps({trigger: {entity: item}, workflow}) {
    if (itemUtils.getConfig(item, 'requireTools') && !workflow.actor.items.some(i => i.system.type?.baseItem === 'cartographer')) {
        genericUtils.notify('CHRISPREMADES.Macros.AdventurersAtlas.NeedTools', 'warn', {localize: true});
        return;
    }
    let effectData = {
        name: item.name + ': ' + genericUtils.translate('CHRISPREMADES.Generic.Source'),
        img: item.img,
        origin: item.uuid,
        flags: {
            dae: {
                stackable: 'noneName',
                showIcon: true
            }
        }
    };
    let source = await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'adventurersAtlasCreator', rules: 'modern'});
    effectData.name = item.name;
    effectData.changes = [{
        key: 'system.attributes.init.bonus',
        value: '1d4',
        mode: 2,
        priority: 20
    }];
    //if (itemUtils.getItemByIdentifier(workflow.actor, 'superiorAtlas')) effectUtils.addMacro(effectData, 'midi.actor', ['superiorAtlasEffect']);
    await Promise.allSettled(workflow.targets.map(t => effectUtils.createEffect(t.actor, effectData, {
        identifier: 'adventurersAtlas',
        parentEntity: source,
        rules: 'modern'
    })));
}
async function rest({trigger: {entity: item}, actor}) {
    if (itemUtils.getConfig(item, 'requireTools') && !actor.items.some(i => i.system.type?.baseItem === 'cartographer')) {
        genericUtils.notify('CHRISPREMADES.Macros.AdventurersAtlas.NeedTools', 'warn', {localize: true});
        return;
    }
    let token = actorUtils.getFirstToken(actor);
    if (!token) return;
    let near = tokenUtils.findNearby(token, 5, 'ally', {includeToken: true});
    if (!near?.length) return;
    let targets;
    if (near.length === 1) {
        targets = [near[0], token];
        if (dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.UseOn', {itemName: item.name, tokenName: near[0].name})))
            await workflowUtils.syntheticItemRoll(item, targets);
    } else {
        targets = await dialogUtils.selectTargetDialog(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), near, {
            type: 'multiple',
            maxAmount: Math.max(1 + actor.system.abilities.int.mod, 2),
            minAmount: 2
        });
        if (!targets || !targets[0]?.length) return;
        targets = targets[0];
        await workflowUtils.syntheticItemRoll(item, targets);
    }
}
async function death({trigger: {actor}}) {
    let maps = effectUtils.getEffectByIdentifier(actor, 'adventurersAtlasCreator');
    if (maps) genericUtils.remove(maps);
}
export let adventurersAtlas = {
    name: 'Adventurer\'s Atlas',
    version: '1.5.16',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: makeMaps,
                priority: 50
            }
        ]
    },
    rest: [
        {
            pass: 'long',
            macro: rest,
            priority: 50
        }
    ],
    death: [
        {
            pass: 'dead',
            macro: death,
            priority: 50
        }
    ],
    ddbi: {
        correctedItems: {
            'Adventurer\'s Atlas': {
                system: {
                    uses: {
                        max: '',
                        spent: '',
                        recovery: []
                    }
                }
            }
        }
    },
    config: [
        {
            value: 'requireTools',
            label: 'CHRISPREMADES.Macros.AdventurersAtlas.RequireTools',
            type: 'checkbox',
            default: true,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
