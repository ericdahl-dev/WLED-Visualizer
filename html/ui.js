/* The commit seam: every run mutation goes through commit(), which applies
   the change and then redraws everything that shows run state. Mutation sites
   say what changed; this seam owns what redraws. It exists because three
   separate bugs shipped from call sites hand-picking their own re-renders. */

// Fields that hold in-progress state a rebuild would destroy: partial text,
// a color picker mid-drag, a slider mid-throw. Selects, checkboxes and
// buttons are atomic — once their change fires there is nothing to lose,
// and effect changes need the rebuild to swap parameter fields.
const EDIT_IN_PROGRESS_TYPES = ['text', 'number', 'color', 'range'];

function isEditingInside(container, activeElement) {
  if (!container || !activeElement) return false;
  if (!container.contains(activeElement)) return false;
  if (activeElement.tagName !== 'INPUT') return false;
  return EDIT_IN_PROGRESS_TYPES.indexOf(activeElement.type) !== -1;
}

function createCommit(deps) {
  return function commit(mutate, opts) {
    mutate();
    deps.renderRunsList();
    const body = deps.getInspectorBody();
    const active = document.activeElement;
    // Foreground commits are user actions: only an edit-in-progress field
    // blocks the rebuild. Background commits are device pushes arriving every
    // second — any focused control in the inspector blocks them, or a poll
    // would close a dropdown under the user's cursor.
    const blocked = (opts && opts.background)
      ? !!(body && active && body.contains(active) && active !== body)
      : isEditingInside(body, active);
    if (deps.getInspectorTab() === 'settings' && !blocked) deps.renderInspector();
    deps.updateLiveBadge();
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createCommit, isEditingInside };
}
