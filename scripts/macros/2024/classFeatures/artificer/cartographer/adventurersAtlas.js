import {actorUtils, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function makeMaps({trigger: {entity: item}, workflow}) {
    if (itemUtils.getConfig(item, 'requireTools') && !workflow.actor.items.some(i => i.system.type?.baseItem === 'cartographer')) {
        genericUtils.notify(genericUtils.format('CHRISPREMADES.Macros.AdventurersAtlas.NeedTools', {itemName: item.name}), 'warn');
        return;
    }
    let effectData = {
        name: item.name + ': ' + genericUtils.translate('CHRISPREMADES.Generic.Source'),
        img: item.img,
        origin: item.uuid,
        flags: {
            dae: {
                stackable: 'noneName'
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
    genericUtils.setProperty(effectData, 'flags.dae.showIcon', true);
    if (itemUtils.getItemByIdentifier(workflow.actor, 'superiorAtlas')) effectUtils.addMacro(effectData, 'midi.actor', ['superiorAtlasEffect']);
    await Promise.allSettled(workflow.targets.map(t => effectUtils.createEffect(t.actor, effectData, {
        identifier: 'adventurersAtlas',
        parentEntity: source,
        rules: 'modern'
    })));
}
async function rest({trigger: {entity: item}, actor}) {
    if (itemUtils.getConfig(item, 'requireTools') && !actor.items.some(i => i.system.type?.baseItem === 'cartographer')) {
        genericUtils.notify(genericUtils.format('CHRISPREMADES.Macros.AdventurersAtlas.NeedTools', {itemName: item.name}), 'warn');
        return;
    }
    let token = actorUtils.getFirstToken(actor);
    if (!token) return;
    let range = itemUtils.getConfig(item, 'enforceRange') ? 5 : 60;
    let near = tokenUtils.findNearby(token, range, 'ally', {includeToken: true});
    if (!near?.length || (near.length === 1 && near[0].id === token.id)) return;
    let userId = socketUtils.firstOwner(actor, true);
    let maxAmount = Math.max(1 + actor.system.abilities.int.mod, 2);
    let minAmount = 2;
    let targets = await dialogUtils.selectTargetDialog(
        item.name, 
        genericUtils.format('CHRISPREMADES.Macros.AdventurersAtlas.Use', {itemName: item.name, maxAmount, minAmount}), 
        near, 
        {type: 'multiple', maxAmount, minAmount, userId}
    );
    if (!targets || !targets[0]?.length) return;
    await workflowUtils.syntheticItemRoll(item, targets[0]);
}
async function death({trigger: {actor}}) {
    let maps = effectUtils.getEffectByIdentifier(actor, 'adventurersAtlasCreator');
    if (maps) genericUtils.remove(maps);
}
export let adventurersAtlas = {
    name: 'Adventurer\'s Atlas',
    version: '1.5.17',
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
        },
        {
            value: 'enforceRange',
            label: 'CHRISPREMADES.Macros.AdventurersAtlas.Enforce5ft',
            type: 'checkbox',
            default: false,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
