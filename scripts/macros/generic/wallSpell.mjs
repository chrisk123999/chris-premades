import cprConstants from '../../constants.mjs';
import {automationUtils, compendiumUtils, crosshairUtils, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, queryUtils, regionUtils, workflowUtils} from '../../proxy.mjs';
import {createRegionLight} from './moveRegion.mjs';
/**
 * Actor that destructible wall panels are copied from.
 * @returns {Promise<object|undefined>}
 */
export function getWallPanelActor() {
    return compendiumUtils.getDocumentByIdentifier(cprConstants.packs.legacy.summons, 'wallPanel');
}
/**
 * Panel actor updates for a destructible wall.
 * @param {string} name Panel name.
 * @param {object} stats Panel statistics.
 * @param {number} stats.hp Hit points of each panel.
 * @param {number} stats.ac Armor class of each panel.
 * @param {string[]} [stats.immune] Damage immunities.
 * @param {string[]} [stats.vulnerable] Damage vulnerabilities.
 * @returns {object}
 */
export function wallPanel(name, {hp, ac, immune = [], vulnerable = []}) {
    return {name, system: {attributes: {hp: {value: hp, max: hp}, ac: {flat: ac, override: ac}}, traits: {di: {value: immune}, dv: {value: vulnerable}}}};
}
/**
 * Tokens a wall's area covers: those its centre line crosses plus those whose centre lies inside its band.
 * @param {object} scene Scene the wall is on.
 * @param {object} path Drawn path, from `crosshairUtils.drawPath`.
 * @param {object[]} shapes Region polygon shapes of the wall band.
 * @returns {object[]}
 */
function tokensInWall(scene, path, shapes) {
    const crossed = new Set(regionUtils.tokensOnPath(scene, path));
    scene.tokens.forEach(token => {
        if (token.object?.actor && regionUtils.containsPoint(shapes, token.object.center)) crossed.add(token.object);
    });
    return [...crossed];
}
/**
 * Draw a wall spell's shape, then build its region, optional side region, Wall documents, lights and panel tokens, and target the creatures in it.
 * Cancelling the drawing ends this cast's concentration and aborts the workflow.
 * @param {object} item The wall spell.
 * @param {object} workflow Workflow of the cast.
 * @param {object} options Wall options.
 * @param {object} options.shape Drawing options for `crosshairUtils.drawPath`, such as `maxLength`, `straight`, `ring` or `panels`.
 * @param {number} options.thickness Wall thickness in scene units.
 * @param {number} [options.height] Wall height in scene units, used for the region elevation.
 * @param {string|object} [options.walls] Wall preset or data for the Wall documents. Omit for none.
 * @param {number} [options.sectionLength] Split the Wall documents into sections of at most this length.
 * @param {boolean} [options.push] Push creatures out of the wall's area to the side their centre is on. They stay targeted.
 * @param {string} [options.color] Region colour.
 * @param {object[]} [options.behaviors] Region behavior data, such as movement cost.
 * @param {object} [options.side] `{identifier, depth, color, name}`: a region on the chosen side, bound to the activity with that identifier.
 * @param {object} [options.panels] Panel actor updates from {@link wallPanel}: give each Wall document a destructible panel token.
 * @param {object} [options.light] Ambient light config placed at the wall's centre, removed with the wall.
 * @param {object} [options.aura] `{identifier, distance, color, name}`: a region covering the wall and reaching this many scene units out from both faces, bound to the activity with that identifier.
 * @param {number} [options.timer] Rounds the wall lasts when the spell has no concentration.
 * @param {boolean} [options.permanent] The wall stays when concentration lasts its full duration, and goes when concentration ends early.
 * @param {boolean} [options.designate] The caster picks creatures the wall's effects leave alone; the caster is always one.
 * @param {object} [options.draw] Extra drawing options, such as `highlightTokens` and `summary`. Tokens on the path are highlighted in the region colour by default.
 * @param {object} [options.flags] Extra region flags.
 * @returns {Promise<object>} `{aborted: true}` when cancelled, otherwise `{path, region, side, flats}`.
 */
export async function castWall(item, workflow, {shape, thickness, height, walls, sectionLength, push, color, behaviors, side, panels, light, aura, timer, permanent, designate, draw = {}, flags = {}} = {}) {
    const scene = workflow.token?.document.parent ?? canvas.scene;
    const concentration = effectUtils.getConcentrationEffect(workflow.actor, item);
    const path = await crosshairUtils.drawPath({
        ...shape,
        ...(shape.panels ? {panels: {...shape.panels, elevation: workflow.token?.document.elevation ?? 0}} : {}),
        ...draw,
        highlightTokens: {path: Number(Color.from(color)), ...draw.highlightTokens},
        title: item.name,
        sides: !!side,
        sideDepth: side?.depth,
        token: workflow.token?.document,
        maxRange: Number(workflow.activity.range.value) || undefined
    });
    if (!path) {
        await effectUtils.endConcentration(workflow.actor, item);
        workflow.aborted = true;
        return {aborted: true};
    }
    const targets = tokensInWall(scene, path, regionUtils.pathBand(path, thickness * scene.dimensions.distancePixels));
    const bottom = workflow.token?.document.elevation ?? 0;
    const elevation = height ? {bottom, top: bottom + height} : undefined;
    const dnd5e = {item: item.uuid, origin: workflow.token?.document.uuid, spellLevel: workflowUtils.getCastLevel(workflow)};
    const sideActivity = side && itemUtils.getActivityByIdentifier(item, side.identifier);
    const {region, side: sideRegion, flats = []} = await regionUtils.createPathRegions(scene, path, {
        thickness,
        push,
        walls,
        sectionLength,
        regionData: {name: item.name, color, elevation, behaviors, flags: genericUtils.mergeObject({dnd5e: {...dnd5e, activity: workflow.activity.uuid}}, flags, {inplace: false})},
        sideDepth: side?.depth,
        sideData: sideActivity ? {name: `${item.name}: ${side.name ?? ''}`, color: side.color, elevation, flags: {dnd5e: {...dnd5e, activity: sideActivity.uuid}}} : undefined
    });
    if (!region) return {aborted: true};
    if (concentration && permanent) {
        await documentUtils.update(concentration, {
            'flags.chris-premades.wallRegion': region.uuid,
            'flags.cat.macros.effect': [...(concentration.flags.cat?.macros?.effect ?? []), {source: 'chris-premades', rules: 'all', identifier: 'wallPermanence'}]
        });
    } else if (concentration) await documentUtils.makeDependent(concentration, [region]);
    else if (timer) await regionUtils.addRegionTimer(workflow.activity, region, timer);
    if (designate) await designateCreatures(item, workflow, region);
    const auraActivity = aura && itemUtils.getActivityByIdentifier(item, aura.identifier);
    await Promise.all([
        auraActivity && createAura(region, path, {name: `${item.name}: ${aura.name ?? ''}`, color: aura.color, elevation, width: thickness + aura.distance * 2, flags: {dnd5e: {...dnd5e, activity: auraActivity.uuid}}}),
        light && createRegionLight(region, light),
        panels && getWallPanelActor().then(sourceActor => sourceActor && regionUtils.addWallPanels(region, {owner: workflow.actor, sourceActor, updates: panels, parent: region, sourceDocument: workflow.activity}))
    ]);
    await workflowUtils.updateTargets(workflow, targets);
    const {animation, options} = automationUtils.getResolvedAnimation(item, 'animation');
    animation?.macros?.play?.(workflow.token?.document, region, {...options, path, side: sideRegion, flats});
    return {path, region, side: sideRegion, flats};
}
async function createAura(region, path, {width, ...data}) {
    const [auraRegion] = await documentUtils.createEmbeddedDocuments(region.parent, 'Region', [{...data, shapes: regionUtils.pathBand(path, width * region.parent.dimensions.distancePixels)}], {cat: {pathRegion: true}}) ?? [];
    if (auraRegion) await documentUtils.makeDependent(region, [auraRegion]);
}
/**
 * Macro for a wall spell whose drawing activities each build a wall with {@link castWall}.
 * @param {object} data Macro data such as `name` and `region` passes.
 * @param {object[]} [data.roll] Roll passes run alongside the drawing pass.
 * @param {object} [data.config] Config entries beside the animation and free-draw options.
 * @param {object} wall Wall setup.
 * @param {string} wall.animation Default animation identifier.
 * @param {object} wall.shapes {@link castWall} options for each drawing activity, keyed by activity identifier.
 * @param {Function} wall.options `(item, identifier) => object` of {@link castWall} options shared by every shape.
 * @param {boolean} [wall.freeDraw] Offer the homebrew option to draw straight walls as paths.
 * @returns {object}
 */
export function wallMacro({roll = [], config = {}, ...data}, {animation, shapes, options, freeDraw}) {
    async function draw({document: item, workflow}) {
        const identifier = workflow.activity.identifier;
        if (!shapes[identifier]) return;
        const wall = {...options(item, identifier), ...shapes[identifier]};
        if (freeDraw) wall.shape = {...wall.shape, straight: !automationUtils.getConfigValue(item, 'freeDraw')};
        const result = await castWall(item, workflow, wall);
        if (result.aborted) return true;
    }
    return {
        version: '2.1.3',
        rules: 'all',
        ...data,
        roll: [{pass: 'itemPreambleComplete', macro: draw, priority: 50}, ...roll],
        config: {...(freeDraw ? {freeDraw: freeDrawConfig} : {}), animation: wallAnimationConfig(animation), ...config}
    };
}
/**
 * Build a help-panel summary for a wall preview: how many creatures the wall covers and, once a side is picked, how many are on it.
 * @param {string} wallKey Localization key with a `{count}` placeholder for creatures in the wall.
 * @param {string} [sideKey] Localization key with a `{count}` placeholder for creatures on the chosen side.
 * @returns {Function}
 */
export function wallSummary(wallKey, sideKey) {
    return ({mode, points, segments, crossed, inSide}) => {
        if ((points ?? segments ?? []).length < (segments ? 1 : 2)) return;
        const text = _loc(wallKey, {count: crossed.length});
        return mode === 'side' && sideKey ? `${text} · ${_loc(sideKey, {count: inSide.length})}` : text;
    };
}
/**
 * Region behavior making movement through the wall cost this many feet per foot.
 * @param {number} multiplier Feet of movement spent per foot moved.
 * @returns {object} Region behavior data.
 */
export function movementCost(multiplier) {
    return {type: 'modifyMovementCost', name: _loc('CHRISPREMADES.Macros.Generic.Wall.MovementCost'), system: {difficulties: {walk: multiplier, fly: multiplier, swim: multiplier, burrow: multiplier}}};
}
/**
 * Region behavior making the wall's space difficult terrain.
 * @returns {object} Region behavior data.
 */
export function difficultTerrain() {
    return {type: 'dnd5e.difficultTerrain', name: _loc('TYPES.RegionBehavior.dnd5e.difficultTerrain'), system: {magical: true, types: [], ignoredDispositions: []}};
}
/** Homebrew option letting a straight-line wall be drawn as a path of several segments. */
const freeDrawConfig = {
    default: false,
    type: 'checkbox',
    label: 'CHRISPREMADES.Macros.Generic.Wall.FreeDraw',
    hint: 'CHRISPREMADES.Macros.Generic.Wall.FreeDrawHint',
    category: 'homebrew'
};
/**
 * Animation config entry for a wall spell.
 * @param {string} identifier Default animation identifier.
 * @returns {object}
 */
function wallAnimationConfig(identifier) {
    return {
        default: {source: 'chris-premades', identifier},
        type: 'selectAnimation',
        inputs: ['sourceToken', 'region', 'options'],
        label: 'CHRISPREMADES.Config.Animation',
        category: 'animations'
    };
}
/**
 * Redraw a wall's animation along a new path.
 * @param {object} item The wall spell.
 * @param {object} region Wall region.
 * @param {object} path New path.
 * @returns {Promise<void>}
 */
export async function playWallReshape(item, region, path) {
    const {animation, options} = automationUtils.getResolvedAnimation(item, 'animation');
    await animation?.macros?.reshape?.(region, {...options, path});
}
async function reshapeWallAnimation(region) {
    const item = regionUtils.getActivity(region)?.item;
    const segments = region.parent.walls.filter(wall => wall.flags.cat?.pathRegion === region.uuid).map(wall => [{x: wall.c[0], y: wall.c[1]}, {x: wall.c[2], y: wall.c[3]}]);
    if (item && segments.length) await playWallReshape(item, region, {segments});
}
/**
 * Keeps a destructible wall's animation in step with its remaining panels.
 * Bound on a wall region. Fires on `panelBroken`.
 */
export const wallPanels = {
    rules: 'all',
    version: '2.1.3',
    region: [
        {pass: 'panelBroken', macro: ({document}) => reshapeWallAnimation(document), priority: 60}
    ]
};
/**
 * Ends a wall with its concentration only when concentration stops early; a wall held for the full duration stays.
 * Bound on the concentration effect by {@link castWall}. Fires on `deleted`.
 */
export const wallPermanence = {
    rules: 'all',
    version: '2.1.3',
    effect: [
        {
            pass: 'deleted',
            macro: async ({document: effect}) => {
                if (!(effect.duration?.remaining > 0)) return;
                const region = await fromUuid(effect.flags['chris-premades']?.wallRegion ?? '');
                if (region) await documentUtils.deleteDocument(region);
            },
            priority: 50
        }
    ]
};
/**
 * Prompt the caster for creatures a spell leaves alone; the caster is always one.
 * @param {Item} item Spell being cast.
 * @param {object} workflow Casting workflow.
 * @param {foundry.abstract.Document} document Document that stores the list.
 * @param {string} [prompt] Dialog prompt localization key.
 * @param {string} [key] Chris Premades flag key the list is stored under.
 */
export async function designateCreatures(item, workflow, document, prompt = 'CHRISPREMADES.Macros.Generic.Wall.Designate', key = 'designated') {
    const scene = workflow.token?.document.parent ?? canvas.scene;
    const others = scene.tokens.filter(token => token.actor && token.id !== workflow.token?.id);
    const picked = others.length ? (await dialogUtils.selectTargetDialog(item.name, _loc(prompt), others, {type: 'multiple', skipDeadAndUnconscious: false, userId: queryUtils.firstOwner(workflow.actor, true)}))?.result ?? [] : [];
    const designated = [workflow.actor.uuid, ...picked.map(token => token.actor?.uuid).filter(Boolean)];
    await documentUtils.setFlag(document, 'chris-premades', key, designated);
}
/**
 * Drop the creatures the caster designated from a wall effect's targets, aborting the workflow when none are left.
 * @param {object} item The wall spell.
 * @param {object} workflow Workflow of the wall's triggered activity.
 * @returns {Promise<true|undefined>} True when the workflow was aborted, ending the pass.
 */
export async function spareDesignated(item, workflow) {
    const scene = workflow.targets.first()?.document.parent ?? canvas.scene;
    const designated = new Set(regionUtils.getPlacedRegions(scene, item).flatMap(region => region.flags['chris-premades']?.designated ?? []));
    if (!designated.size) return;
    const spared = Array.from(workflow.targets).filter(token => designated.has(token.actor?.uuid));
    if (!spared.length) return;
    if (spared.length === workflow.targets.size) {
        workflow.aborted = true;
        return true;
    }
    await workflowUtils.removeTargets(workflow, spared);
}
