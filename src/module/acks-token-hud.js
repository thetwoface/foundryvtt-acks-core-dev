/* -------------------------------------------- */
import { AcksUtility } from "./utility.js";

/* -------------------------------------------- */
export class AcksTokenHud {

  static init() {
    // Integration du TokenHUD
    Hooks.on('renderTokenHUD', (app, html, data) => { AcksTokenHud.addTokenHudExtensions(app, html, data._id) });
  }

  /* -------------------------------------------- */
  static async removeExtensionHud(app, html, tokenId) {
    html.find('.control-icon.acks-roll').remove()
    html.find('.control-icon.acks-action').remove()
  }

  /* -------------------------------------------- */
  static async addExtensionHud(app, html, tokenId) {

    let token = canvas.tokens.get(tokenId)
    let actor = token.actor
    app.hasExtension = true

    const hudData = { actor: actor, actionsList: actor.buildFavoriteActions(), rollsList: actor.buildRollList() }

    const controlIconActions = html.find('.control-icon[data-action=combat]');
    // initiative
    await AcksTokenHud._configureSubMenu(controlIconActions, 'systems/acks/templates/token/hud-actor-actions.html', hudData,
      (event) => {
        let actionIndex = Number(event.currentTarget.attributes['data-action-index'].value)
        let action = hudData.actionsList[actionIndex]
        const actionItem = actor.items.get(action._id)
        if (actionItem.type == "weapon") {
          actionItem.rollWeapon()
        } else if (actionItem.type == "spell") {
          actionItem.spendSpell();
        } else {
          actionItem.rollFormula();
        } 
      })

    const controlIconTarget = html.find('.control-icon[data-action=config]');
    // att+apt+career
    await AcksTokenHud._configureSubMenu(controlIconTarget, 'systems/acks/templates/token/hud-actor-rolls.html', hudData,
      (event) => {
        let rollIndex = Number(event.currentTarget.attributes['data-roll-index'].value)
        let roll = hudData.rollsList[rollIndex]
        actor.rollCheck(roll.key)
      })
  }

  /* -------------------------------------------- */
  static async addTokenHudExtensions(app, html, tokenId) {
    const controlIconCombat = html.find('.control-icon[data-action=combat]')
    if (controlIconCombat.length > 0) {
      AcksTokenHud.addExtensionHud(app, html, tokenId);
    }
  }

  /* -------------------------------------------- */
  static async _configureSubMenu(insertionPoint, template, hudData, onMenuItem) {
    const hud = $(await renderTemplate(template, hudData))
    const list = hud.find('div.acks-hud-list')

    AcksTokenHud._toggleHudListActive(hud, list);

    hud.find('img.acks-hud-togglebutton').click(event => AcksTokenHud._toggleHudListActive(hud, list));
    list.find('.acks-hud-menu').click(onMenuItem);

    insertionPoint.after(hud);
  }

  /* -------------------------------------------- */
  static _showControlWhen(control, condition) {
    if (condition) {
      control.show()
    }
    else {
      control.hide()
    }
  }

  /* -------------------------------------------- */
  static _toggleHudListActive(hud, list) {
    hud.toggleClass('active')
    AcksTokenHud._showControlWhen(list, hud.hasClass('active'))
  }
}