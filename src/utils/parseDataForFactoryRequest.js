export function parseDataForFactoryRequest(request) {
  const message = request.unit.messages.find((m) => {
    return m.app === "data";
  });
  if (!message) return null;

  return message.payload;
}
