import {
  user,
  session,
  account,
  verification,
  organization,
  member,
  invitation,
  chat,
  message,
  vote,
  document,
  suggestion,
  stream,
} from "./tables";

import { role, visibility, messageRole, artifactKind } from "./enums";

export { roles, messageRoles, artifactKinds } from "./enums";

export const $role = role.enum;
export const $visibility = visibility.enum;
export const $messageRole = messageRole.enum;
export const $artifactKind = artifactKind.enum;

export const $user = user.table;
export const $session = session.table;
export const $account = account.table;
export const $verification = verification.table;
export const $organization = organization.table;
export const $member = member.table;
export const $invitation = invitation.table;
export const $chat = chat.table;
export const $message = message.table;
export const $vote = vote.table;
export const $document = document.table;
export const $suggestion = suggestion.table;
export const $stream = stream.table;

export const schema = {
  //enums
  role: role.enum,
  visibility: visibility.enum,
  messageRole: messageRole.enum,
  artifactKind: artifactKind.enum,

  //tables
  user: user.table,
  session: session.table,
  account: account.table,
  verification: verification.table,
  organization: organization.table,
  member: member.table,
  invitation: invitation.table,
  chat: chat.table,
  message: message.table,
  vote: vote.table,
  document: document.table,
  suggestion: suggestion.table,
  stream: stream.table,

  //relations
  memberRelations: member.relations,
};
