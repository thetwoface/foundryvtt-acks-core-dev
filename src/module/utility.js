export class AcksUtility {

  /* -------------------------------------------- */
  static loadInternalTables() {
    // Fetch the internal tables from the ruledata/internal_tables.json file
    // Fetch the file
    const filePath = "systems/acks/module/ruledata/internal_tables.json";
    const file = fetch(filePath)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Process the data
        console.log("Internal Tables Loaded", data);
        game.acks.tables = data;
      })
      .catch(error => {
        console.error("Error loading internal tables:", error);
      });
  }

  /* -------------------------------------------- */
  static updateWeightsLanguages() {
    for (let a of game.actors) {
      a.updateWeight();
      a.updateLanguages();
      a.updateImplements();
    }
    for (let i of game.items) {
      i.updateWeight();
    }
  }

  /* -------------------------------------------- */
  static setupSocket() {
    game.socket.on("system.acks", async (data) => {
      console.log("ACKS SOCKET", data);
      if (data.type === "rollInitiative" && game.user.isGM) {
        let combat = game.combats.get(data.combatId);
        combat.rollInitiative(data.ids, data.options);
      }
    });
  }

  /* -------------------------------------------- */
  static displayWelcomeMessage() {
    let welcomeMessage = game.settings.get('acks', 'welcome-message-12-2')
    console.log("WELCOME", welcomeMessage)
    if (!welcomeMessage) {
      game.settings.set('acks', 'welcome-message-12-2', true)
      // New dialog with full message
      let d = new Dialog({
        title: game.i18n.localize('ACKS.Welcome.Title'),
        content: `<p>${game.i18n.localize('ACKS.Welcome.Message-12-2')}</p>`,
        buttons: {
          ok: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize('ACKS.Welcome.Button'),
          },
        },
        default: 'ok',
      }, { width: 720 });
      d.render(true);
    }

  }

  /* -------------------------------------------- */
  static async loadCompendiumData(compendium) {
    const pack = game.packs.get(compendium);
    return await pack?.getDocuments() ?? [];
  }

  /* -------------------------------------------- */
  static async loadCompendium(compendium, filter = item => true) {
    let compendiumData = await AcksUtility.loadCompendiumData(compendium);
    return compendiumData.filter(filter);
  }

  /* -------------------------------------------- */
  static prepareActiveEffect(effectId) {
    let status = CONFIG.ACKS.statusEffects.find(it => it.id.includes(effectId))
    if (status) {
      status = foundry.utils.duplicate(status)
      status.statuses = [effectId]
    }
    return status;
  }

  /* -------------------------------------------- */
  static addUniqueStatus(actor, statusId) {
    let status = actor.effects.find(it => it.statuses.has(statusId))
    if (!status) {
      let effect = this.prepareActiveEffect(statusId)
      actor.createEmbeddedDocuments("ActiveEffect", [effect]);
    }
  }

  static async removeEffect(actor, statusId) {
    let effect = actor.effects.find(it => it.statuses.has(statusId));
    if (effect) {
      await actor.deleteEmbeddedDocuments("ActiveEffect", [effect.id]);
    }
  }

  static async prepareActiveEffectCategories(effects) {
    // Define effect header categories
    const categories = {
      temporary: {
        type: 'temporary',
        label: game.i18n.localize('ACKS.Effect.Temporary'),
        effects: [],
      },
      passive: {
        type: 'passive',
        label: game.i18n.localize('ACKS.Effect.Passive'),
        effects: [],
      },
      inactive: {
        type: 'inactive',
        label: game.i18n.localize('ACKS.Effect.Inactive'),
        effects: [],
      },
    };

    // Iterate over active effects, classifying them into categories
    for (let e of effects) {
      if (e.disabled) categories.inactive.effects.push(e);
      else if (e.isTemporary) categories.temporary.effects.push(e);
      else categories.passive.effects.push(e);
    }
    return categories;
  }

  static async onManageActiveEffect(event, owner) {
    event.preventDefault();
    const a = event.currentTarget;
    const li = a.closest('li');
    let effect = li.dataset.effectId
      ? owner.effects.get(li.dataset.effectId)
      : null;
    switch (a.dataset.action) {
      case 'create':
        effect = await ActiveEffect.implementation.create({
          name: game.i18n.format('DOCUMENT.New', { type: game.i18n.localize('DOCUMENT.ActiveEffect') }),
          transfer: true,
          img: 'icons/svg/aura.svg',
          origin: owner.uuid,
          'duration.rounds':
            li.dataset.effectType === 'temporary' ? 1 : undefined,
          disabled: li.dataset.effectType === 'inactive',
          changes: [{
          }]
        }, { parent: owner });
        return effect.sheet.render(true);
      case 'edit':
        return effect.sheet.render(true);
      case 'delete':
        return effect.delete();
      case 'toggle':
        return effect.update({ disabled: !effect.disabled });
    }
  }

}