/*******************************************************/
import { AcksUtility } from "./utility.js";
import { AcksCombat } from "./combat.js";

/*******************************************************/
export class AcksSurprise extends FormApplication {

  /*******************************************************/
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["acks", "dialog", "party-sheet"],
      template: "systems/acks/templates/apps/dialog-surprise.html",
      width: 820,
      height: 480,
      resizable: false,
    });
  }

  /*******************************************************/
  /**
* Construct and return the data object used to render the HTML template for this form application.
* @return {Object}
*/
  getData() {

    const data = {
      data: this.object,
      config: foundry.utils.duplicate(CONFIG.ACKS),
      user: game.user,
    }
    for (let key in data.config.surpriseTableAdventurers) {
      let sData = data.config.surpriseTableAdventurers[key];
      for (let key1 in sData) {
        let sData1 = sData[key1];
        sData1.localized = game.i18n.localize(sData1.description);
      }
    }
    return data;
  }

  /*******************************************************/
  async rollSurprise(surpriseDef) {
    let monsters = this.object.pools.hostile;
    for (let c of monsters) {
      console.log("Combatant", c);
      let roll = await new Roll("1d6+"+c.actor.system.surprise.mod+"+"+surpriseDef.monsterModifier).roll();
      let surprised = roll.total <= 2;
      let msgText = (surprised) ? "ACKS.surprise.surprised" : "ACKS.surprise.notsurprised";
      let message = game.i18n.format(msgText, {name: c.actor.name, result: roll.total, surprised});
      let chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: c.actor }),
        content: message,
      };
      ChatMessage.create(chatData);
      if (surprised) {
        AcksUtility.addUniqueStatus(c.actor, "surprised")
      }
    }
    let adventurers = this.object.pools.friendly;
    for (let c of adventurers) {
      let roll = new Roll("1d6+"+c.actor.system.surprise.mod+"+"+surpriseDef.adventurerModifier).roll({async: false});
      let surprised = roll.total <= 2;
      let msgText = (surprised) ? "ACKS.surprise.surprised" : "ACKS.surprise.notsurprised";
      let message = game.i18n.format(msgText, {name: c.actor.name, result: roll.total, surprised});
      let chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: c.actor }),
        content: message,
      };
      ChatMessage.create(chatData);
      if (surprised) {
        AcksUtility.addUniqueStatus(c.actor, "surprised")
      }
    }

    // Now roll initiative
    //AcksCombat.individualInitiative(this.object.combatData, this.object.diff);
    this.close();
    this.object.combatData.internalStartCombat(); // Restarts the combat !
  }

  /*******************************************************/
  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    let myself = this;

    html.find(".roll-surprise-button").click((ev) => {
      let keyA = $(ev.currentTarget).data("key-adventurer");
      let keyM = $(ev.currentTarget).data("key-monster");
      let surpriseDef = CONFIG.ACKS.surpriseTableAdventurers[keyA][keyM];
      myself.rollSurprise(surpriseDef);
    })
  }

}