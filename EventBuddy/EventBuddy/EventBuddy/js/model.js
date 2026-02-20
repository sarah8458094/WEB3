class EventModel extends EventTarget {
  constructor() {
    super();
    this.events = [];
    this.tags = [];
    this.participants = [];
    this.invitationStatus = {};
  }

  async load() {
    const data = this.#fallbackData();

    this.events = data.events ?? [];
    this.tags = data.tags ?? [];
    this.participants = data.participants ?? [];
    this.invitationStatus = data.invitationStatus ?? {};
    this.#emit("model:loaded");
  }

  getState() {
    return {
      events: this.events,
      tags: this.tags,
      participants: this.participants,
      invitationStatus: this.invitationStatus
    };
  }

  createEvent(payload) {
    const error = this.#validateEvent(payload);
    if (error) {
      throw new Error(error);
    }

    const event = {
      ...payload,
      id: this.#id("e"),
      tagIds: payload.tagIds ?? [],
      participantIds: payload.participantIds ?? []
    };

    this.events = [...this.events, event];
    this.#emit("events:changed");
  }

  updateEvent(id, payload) {
    const error = this.#validateEvent(payload);
    if (error) {
      throw new Error(error);
    }

    this.events = this.events.map((event) =>
      event.id === id
        ? {
            ...event,
            ...payload,
            tagIds: payload.tagIds ?? [],
            participantIds: payload.participantIds ?? []
          }
        : event
    );
    this.#emit("events:changed");
  }

  deleteEvent(id) {
    this.events = this.events.filter((event) => event.id !== id);
    delete this.invitationStatus[id];
    this.#emit("events:changed");
  }

  createTag(label) {
    const clean = label.trim();
    if (!clean) {
      throw new Error("Tag-Name fehlt.");
    }
    if (this.tags.some((tag) => tag.label.toLowerCase() === clean.toLowerCase())) {
      throw new Error("Tag existiert bereits.");
    }

    this.tags = [...this.tags, { id: this.#id("t"), label: clean }];
    this.#emit("tags:changed");
  }

  updateTag(id, label) {
    const clean = label.trim();
    if (!clean) {
      throw new Error("Tag-Name fehlt.");
    }
    if (this.tags.some((tag) => tag.label.toLowerCase() === clean.toLowerCase() && tag.id !== id)) {
      throw new Error("Tag existiert bereits.");
    }

    this.tags = this.tags.map((tag) =>
      tag.id === id ? { ...tag, label: clean } : tag
    );
    this.#emit("tags:changed");
  }

  deleteTag(id) {
    const isUsed = this.events.some((event) => event.tagIds.includes(id));
    if (isUsed) {
      throw new Error("Tag wird noch verwendet.");
    }

    this.tags = this.tags.filter((tag) => tag.id !== id);
    this.#emit("tags:changed");
  }

  createParticipant(payload) {
    const error = this.#validateParticipant(payload);
    if (error) {
      throw new Error(error);
    }
    const participant = {
      id: this.#id("p"),
      name: payload.name.trim(),
      email: payload.email.trim(),
      initials: payload.initials.trim()
    };
    this.participants = [...this.participants, participant];
    this.#emit("participants:changed");
  }

  updateParticipant(id, payload) {
    const error = this.#validateParticipant(payload);
    if (error) {
      throw new Error(error);
    }
    this.participants = this.participants.map((participant) =>
      participant.id === id
        ? {
            ...participant,
            name: payload.name.trim(),
            email: payload.email.trim(),
            initials: payload.initials.trim()
          }
        : participant
    );
    this.#emit("participants:changed");
  }

  deleteParticipant(id) {
    this.participants = this.participants.filter((participant) => participant.id !== id);
    this.events = this.events.map((event) => ({
      ...event,
      participantIds: event.participantIds.filter((pid) => pid !== id)
    }));
    Object.keys(this.invitationStatus).forEach((eventId) => {
      if (this.invitationStatus[eventId]) {
        delete this.invitationStatus[eventId][id];
      }
    });
    this.#emit("participants:changed");
    this.#emit("events:changed");
  }

  setInvitationStatus(eventId, participantId, status) {
    const allowed = new Set(["zugesagt", "abgelehnt", "unentschieden"]);
    if (!allowed.has(status)) {
      throw new Error("Ungueltiger Einladungsstatus.");
    }

    const event = this.events.find((item) => item.id === eventId);
    if (!event) {
      throw new Error("Event nicht gefunden.");
    }
    if (!event.participantIds.includes(participantId)) {
      throw new Error("Teilnehmer ist fuer dieses Event nicht eingeladen.");
    }

    if (!this.invitationStatus[eventId]) {
      this.invitationStatus[eventId] = {};
    }
    this.invitationStatus[eventId][participantId] = status;
    this.#emit("invitations:changed");
  }

  #validateEvent(payload) {
    if (!payload.title || !payload.title.trim()) {
      return "Titel fehlt.";
    }
    if (!payload.dateTime) {
      return "Datum/Zeit fehlt.";
    }
    if (!payload.location || !payload.location.trim()) {
      return "Ort fehlt.";
    }
    if (!payload.status) {
      return "Status fehlt.";
    }
    return "";
  }

  #validateParticipant(payload) {
    if (!payload.name || !payload.name.trim()) {
      return "Name fehlt.";
    }
    if (!payload.email || !payload.email.trim()) {
      return "E-Mail fehlt.";
    }
    if (!payload.initials || !payload.initials.trim()) {
      return "Kuerzel fehlt.";
    }
    return "";
  }

  #emit(name) {
    this.dispatchEvent(new CustomEvent(name, { detail: this.getState() }));
  }

  #id(prefix) {
    return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  #fallbackData() {
    return {
      participants: [
        { id: "p1", name: "Max Mustermann", email: "max.muster@gmail.com", initials: "MM" },
        { id: "p2", name: "Susi Musterfrau", email: "susi.muster@gmail.com", initials: "SM" },
        { id: "p3", name: "Lea Novak", email: "lea.novak@gmail.com", initials: "LN" },
        { id: "p4", name: "Ali Yilmaz", email: "ali.yilmaz@gmail.com", initials: "AY" },
        { id: "p5", name: "Johanna Berger", email: "johanna.berger@gmail.com", initials: "JB" },
        { id: "p6", name: "Tobias Kern", email: "tobias.kern@gmail.com", initials: "TK" }
      ],
      tags: [
        { id: "t1", label: "party" },
        { id: "t2", label: "musik" },
        { id: "t3", label: "workshop" },
        { id: "t4", label: "team" },
        { id: "t5", label: "sommerfest" }
      ],
      events: [
        {
          id: "e1",
          title: "Geburtstag Max",
          dateTime: "2026-02-12T18:00",
          location: "XY 23",
          description: "Bring your own cake.",
          status: "geplant",
          tagIds: ["t1"],
          participantIds: ["p1", "p2"]
        },
        {
          id: "e2",
          title: "Konzert Probe",
          dateTime: "2026-02-12T20:00",
          location: "YZ 36",
          description: "Soundcheck 19:30.",
          status: "geplant",
          tagIds: ["t2"],
          participantIds: ["p2", "p3"]
        },
        {
          id: "e3",
          title: "Vereinsabend",
          dateTime: "2026-01-20T19:00",
          location: "Vereinsraum",
          description: "Jahresrueckblick und Planung.",
          status: "abgeschlossen",
          tagIds: ["t3"],
          participantIds: ["p1", "p4"]
        },
        {
          id: "e4",
          title: "Sommerfest Planung",
          dateTime: "2026-03-04T17:30",
          location: "Cafeteria",
          description: "Themen, Budget, Aufgaben.",
          status: "geplant",
          tagIds: ["t4", "t5"],
          participantIds: ["p2", "p5", "p6"]
        },
        {
          id: "e5",
          title: "Teambuilding",
          dateTime: "2026-02-22T16:00",
          location: "Sporthalle",
          description: "Gemeinsame Aktivitaeten und Abschluss.",
          status: "geplant",
          tagIds: ["t4"],
          participantIds: ["p1", "p3", "p6"]
        }
      ],
      invitationStatus: {
        e1: { p1: "zugesagt", p2: "abgelehnt" },
        e2: { p2: "zugesagt" },
        e3: { p1: "zugesagt", p4: "zugesagt" },
        e4: { p2: "zugesagt", p5: "unentschieden", p6: "zugesagt" },
        e5: { p1: "unentschieden", p3: "zugesagt", p6: "abgelehnt" }
      }
    };
  }
}



