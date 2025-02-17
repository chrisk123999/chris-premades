import {actorUtils, dialogUtils, effectUtils, genericUtils} from '../../../utils.js';
import {upcastTargets} from '../../generic/upcastTargets.js';
async function grovel({trigger: {entity: effect}}) {
    let proneEffect = effectUtils.getEffectByStatusID(effect.parent, 'prone');
    if (proneEffect || actorUtils.checkTrait(effect.parent, 'ci', 'prone')) return;
    await effectUtils.applyConditions(effect.parent, ['prone']);
}
async function turnStart({trigger: {entity: effect}}) {
    let identifier = genericUtils.getIdentifier(effect);
    if (!identifier) return;
    await dialogUtils.confirm(effect.name, genericUtils.translate('CHRISPREMADES.Macros.Command.YouMust') + genericUtils.translate('CHRISPREMADES.Macros.Command.' + identifier.replaceAll('command', '').capitalize()), {buttons: 'ok'});
}
export let command = {
    name: 'Command',
    version: '1.1.38',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: upcastTargets.plusOne,
                priority: 50
            }
        ]
    }
};
export let commandTurnStart = {
    name: command.name,
    version: command.version,
    rules: command.rules,
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ]
};
export let commandGrovel = {
    name: command.name,
    version: command.version,
    rules: command.rules,
    combat: [
        {
            pass: 'turnStart',
            macro: grovel,
            priority: 49
        }
    ]
};