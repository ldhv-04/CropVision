/**
 * vertexEditHelpers.js — Pure immutable vertex manipulation helpers for GIS editing
 */

export const updateVertex = (editState, index, latlng) => {
  const vertices = [...editState.currentVertices];
  const undoStack = [...editState.undoStack, [...vertices]];
  vertices[index] = latlng;
  return { ...editState, currentVertices: vertices, undoStack };
};

export const insertVertex = (editState, afterIndex, latlng) => {
  const vertices = [...editState.currentVertices];
  const undoStack = [...editState.undoStack, [...vertices]];
  vertices.splice(afterIndex + 1, 0, latlng);
  return { ...editState, currentVertices: vertices, undoStack };
};

export const deleteVertex = (editState, index) => {
  if (editState.currentVertices.length <= 3) return editState;
  const vertices = [...editState.currentVertices];
  const undoStack = [...editState.undoStack, [...vertices]];
  vertices.splice(index, 1);
  return { ...editState, currentVertices: vertices, undoStack };
};

export const popUndoVertex = (editState) => {
  const undoStack = [...editState.undoStack];
  const previous = undoStack.pop();
  if (!previous) return editState;
  return { ...editState, currentVertices: previous, undoStack };
};
