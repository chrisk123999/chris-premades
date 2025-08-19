import {constants, effectUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function damage({trigger, workflow}) {
    if (!workflow.activity.hasSave || workflow.item.type != 'spell') return;
    let damageTypes = workflowUtils.getDamageTypes(workflow.damageRolls);
    await Promise.all(workflow.targets.map(async token => {
        let validTokens = tokenUtils.findNearby(token, 60, 'any', {includeToken: true}).filter(i => effectUtils.getEffectByIdentifier(i.actor, 'coronaOfLightEffect'));
        await Promise.all(validTokens.map(async vToken => {
            let effect = effectUtils.getEffectByIdentifier(vToken.actor, 'coronaOfLightEffect');
            if (!effect) return;
            let item = await effectUtils.getOriginItem(effect);
            if (!item) return;
            let validTypes = itemUtils.getConfig(item, 'damageTypes');
            if (!validTypes.some(type => damageTypes.has(type))) return;
            await effectUtils.createEffect(token.actor, constants.disadvantageEffectData);
        }));
    }));
}
export let coronaOfLight = {
    name: 'Corona of Light',
    version: '1.3.9',
    rules: 'modern',
    config: [
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['fire', 'radiant'],
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let coronaOfLightEffect = {
    name: coronaOfLight.name,
    version: coronaOfLight.version,
    rules: coronaOfLight.rules,
    midi: {
        actor: [
            {
                pass: 'sceneDamageRollComplete',
                macro: damage,
                priority: 250
            },
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 250
            }
        ]
    }
};