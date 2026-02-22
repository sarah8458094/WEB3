
const model = new EventModel();
const controller = new EventController(model);

async function start() {
  await model.load();
  const pages = document.querySelectorAll(".eb__page[data-page]");
  const isOneSider = pages.length > 1;
  const page = document.body.dataset.page || "events";
  const views = {
    events: initEventsView,
    participants: initParticipantsView,
    invitations: initInvitationsView,
    profile: initProfileView
  };

  if (isOneSider) {
    Object.values(views).forEach((init) => init(model, controller));
    return;
  }

  const init = views[page];
  if (!init) {
    return;
  }
  init(model, controller);
}

start();

