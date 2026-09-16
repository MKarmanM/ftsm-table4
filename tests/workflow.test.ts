import test from "node:test";
import assert from "node:assert/strict";
import { getAllowedActions } from "../lib/workflow-constants";
import { ProformaStatus, ReviewActionType } from "../lib/generated/prisma/enums";

test("workflow exposes the expected approval chain", () => {
  assert.deepEqual(getAllowedActions(ProformaStatus.DRAFT), [ReviewActionType.SUBMIT]);
  assert.deepEqual(getAllowedActions(ProformaStatus.SUBMITTED), [
    ReviewActionType.REQUEST_CHANGES,
    ReviewActionType.APPROVE,
  ]);
  assert.deepEqual(getAllowedActions(ProformaStatus.APPROVED), [
    ReviewActionType.REQUEST_CHANGES,
    ReviewActionType.PUBLISH,
  ]);
});

test("published versions can be archived while archived versions are terminal", () => {
  assert.deepEqual(getAllowedActions(ProformaStatus.PUBLISHED), [
    ReviewActionType.ARCHIVE,
  ]);
  assert.deepEqual(getAllowedActions(ProformaStatus.SUPERSEDED), [
    ReviewActionType.ARCHIVE,
  ]);
  assert.deepEqual(getAllowedActions(ProformaStatus.ARCHIVED), []);
});
