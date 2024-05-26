export class AcksUtility {

  static prepareActiveEffect(effectId) {
    let status = CONFIG.ACKS.statusEffects.find(it => it.id.includes(effectId))
    if (status) {
      status = foundry.utils.duplicate(status)
      status.statuses = [effectId]
    }
    return status;
  }

  static addUniqueStatus(actor, statusId) {
    let status = actor.effects.find(it => it.statuses.has(statusId) )
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

}