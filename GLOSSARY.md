# Glossary

## Card
A single study item with a **question** (front) and an **answer** (back), both rich text. Called "flash" informally by the user. _Avoid_: flash, flashcard (in UI copy, "card" is canonical).

## Deck
A user-chosen collection that organizes Cards. A Card belongs to one Deck. _Avoid_: grupo, pasta.

## Label
A user-created tag attached to Cards, cutting across Decks. A Card may carry many Labels.

## New Card
A Card with no schedule: it has never received a Rating, or its schedule was reset. Past Ratings of a reset Card still count in its history.

## Schedule Reset
The explicit user action that discards a Card's schedule and turns it back into a New Card, shown as "Reiniciar agendamento". Editing a Card's question, answer, Labels or Deck never resets its schedule. _Avoid_: forget, esquecer.

## Card State
Where a Card stands in its learning, shown in the UI as one of three: **Novo** (a New Card), **Em aprendizado** (current interval under 21 days) or **Maduro** (current interval of 21 days or more). Being due today is not a state; it cuts across all three. _Avoid_: Learning, Relearning, Review (scheduler-internal states, never shown).

## New Cards Per Day
The user-set cap on how many New Cards join a Daily Review. Does not apply to a Study Session started right after creating Cards.

## Study Session
One run through a set of Cards where the user sees each question, reveals the answer, and rates its difficulty. The set is either the whole Daily Review, one Deck's share of it, or New Cards just created. Only due or New Cards are ever studied. _Avoid_: bateria, quiz.

## Rating
The difficulty the user reports for a Card at the end of seeing it in a Study Session. Drives when the Card is next due.

## Daily Review
The batch of all Cards due on a given calendar day for a user, plus New Cards up to the New Cards Per Day cap. Intervals are counted in whole days, so a user has at most one Daily Review per day, announced once at the user's chosen time. _Avoid_: grupo de revisão.

## Streak
The count of consecutive Daily Reviews the user completed, shown as "Sequência". A day with no Cards due, or one marked as seen, neither breaks nor extends it. _Avoid_: ofensiva, combo.

## Review Time
The time of day the user chooses to be notified of their Daily Review.

## Comment
A note the user attaches to a Card.
