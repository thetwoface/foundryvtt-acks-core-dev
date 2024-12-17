export class AcksUtility {

  static updateWeightsLanguages()
  {
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
    const effect = li.dataset.effectId
      ? owner.effects.get(li.dataset.effectId)
      : null;
    switch (a.dataset.action) {
      case 'create':
        return owner.createEmbeddedDocuments('ActiveEffect', [
          {
            name: game.i18n.format('DOCUMENT.New', {
              type: game.i18n.localize('DOCUMENT.ActiveEffect'),
            }),
            icon: 'icons/svg/aura.svg',
            origin: owner.uuid,
            'duration.rounds':
              li.dataset.effectType === 'temporary' ? 1 : undefined,
            disabled: li.dataset.effectType === 'inactive',
          },
        ]);
      case 'edit':
        return effect.sheet.render(true);
      case 'delete':
        return effect.delete();
      case 'toggle':
        return effect.update({ disabled: !effect.disabled });
    }
  }

}