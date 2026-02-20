
const model = new EventModel();
const controller = new EventController(model);

async function start() {
  await model.load();
  const page = document.body.dataset.page || "events";
  const views = {
    events: initEventsView,
    participants: initParticipantsView,
    invitations: initInvitationsView,
    profile: initProfileView
  };
  const init = views[page];
  if (init) {
    init(model, controller);
  }
}

start();

