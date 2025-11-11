export function create(onAppend) {
  let lastRenderedCount = 0;

  function onMessagesChanged(messages) {
    if (!Array.isArray(messages)) return;

    // If array shrank or reset, re-render from scratch by resetting the counter.
    if (messages.length < lastRenderedCount) {
      lastRenderedCount = 0;
    }

    // Append only the new slice.
    if (messages.length > lastRenderedCount) {
      const newSlice = messages.slice(lastRenderedCount);
      onAppend(newSlice);
      lastRenderedCount = messages.length;
    }
  }

  return { onMessagesChanged };
}
