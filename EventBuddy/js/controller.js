class EventController {
  constructor(model) {
    this.model = model;
  }

  getState() {
    return this.model.getState();
  }

  createEvent(payload) {
    this.model.createEvent(payload);
  }

  updateEvent(id, payload) {
    this.model.updateEvent(id, payload);
  }

  deleteEvent(id) {
    this.model.deleteEvent(id);
  }

  createTag(label) {
    this.model.createTag(label);
  }

  updateTag(id, label) {
    this.model.updateTag(id, label);
  }

  deleteTag(id) {
    this.model.deleteTag(id);
  }

  createParticipant(payload) {
    this.model.createParticipant(payload);
  }

  updateParticipant(id, payload) {
    this.model.updateParticipant(id, payload);
  }

  deleteParticipant(id) {
    this.model.deleteParticipant(id);
  }

  setInvitationStatus(eventId, participantId, status) {
    this.model.setInvitationStatus(eventId, participantId, status);
  }

  on(eventName, handler) {
    this.model.addEventListener(eventName, handler);
  }
}

