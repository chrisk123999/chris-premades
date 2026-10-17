import {automationUtils, documentUtils, effectUtils, summonUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
async function created({document, summon}) {
    const activity = document.system.activities.find(activity => activity.type === 'summon');
    const effectData = documentUtils.getBaseEffectData(activity, {
        name: document.name,
        img: document.img,
        origin: document.uuid,
        identifier: 'findSteed',
        activityUuid: activity.uuid,
        macros: [
            {
                type: 'roll',
                macros: [
                    {
                        source: 'chris-premades',
                        rules: '2024',
                        identifier: 'find-steed-life-bond'
                    }
                ]
            }
        ]
    });
    const [effect] = await effectUtils.createEffects(summon.owner, [effectData]);
    if (effect) await documentUtils.makeDependent(summon.actor, [effect]);
}
async function lifeBond({document: effect, workflow, ditem, targetToken}) {
    if (workflow.item?.type !== 'spell' || !(workflowUtils.getCastLevel(workflow) > 0)) return;
    const healed = ditem.newHP - ditem.oldHP;
    if (!(healed > 0)) return;
    const item = effectUtils.getOriginActivitySync(effect)?.item;
    if (!item) return;
    const range = automationUtils.getConfigValue(item, 'lifeBondRange');
    const steedTokens = summonUtils.getSummonsBySource(item).map(steed => steed.token).filter(token => token?.parent === targetToken.parent && tokenUtils.getDistance(targetToken, token) <= range);
    if (!steedTokens.length) return;
    await workflowUtils.applyDamage(steedTokens, healed, 'healing');
}
async function feyStep({document, workflow}) {
    const steedToken = workflow.token?.document;
    if (!steedToken) return;
    const riders = steedToken.parent.tokens.filter(token => token.id !== steedToken.id && token.object && steedToken.object?.bounds.contains(token.object.center.x, token.object.center.y));
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation');
    await tokenUtils.teleportToken(steedToken, {range: workflow.activity.range.value, animation, options, requireSight: false, followers: riders});
}
export const findSteed = {
    name: 'Find Steed',
    version: '2.1.3',
    rules: '2024',
    summon: [
        {pass: 'create', macro: created, priority: 50}
    ],
    config: {
        lifeBondRange: {default: 5, type: 'number', label: 'CHRISPREMADES.Macros.Modern.FindSteed.LifeBondRange', category: 'homebrew'}
    }
};
export const findSteedLifeBond = {
    name: 'Find Steed: Life Bond',
    version: findSteed.version,
    rules: findSteed.rules,
    roll: [
        {pass: 'targetDamageComplete', macro: lifeBond, priority: 250}
    ]
};
export const otherworldlySteedFeyStep = {
    name: 'Otherworldly Steed: Fey Step',
    version: findSteed.version,
    rules: findSteed.rules,
    roll: [
        {pass: 'itemRollFinished', macro: feyStep, priority: 50}
    ],
    config: {
        animation: {default: {source: 'chris-premades', identifier: 'mistyStep'}, type: 'selectAnimation', inputs: ['token', 'options'], label: 'CHRISPREMADES.Config.Animation', category: 'animations'}
    }
};
