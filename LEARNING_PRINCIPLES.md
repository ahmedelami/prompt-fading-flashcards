# Learning Science Principles

This flashcard application implements several evidence-based learning principles:

## Core Learning Principles

### Worked Example Effect (Prompt Fading)
Progressive reveal of information through sequential steps mimics worked examples that gradually fade support. Research shows this reduces cognitive load and improves learning compared to problem-solving alone. [See: Cognitive Load Theory explanation](https://youtu.be/0xS68sl2D70?si=PKltvIx9DFxgMTrV&t=1985)

**Two Fading Modes Available:**

- **Forward Fading (Problem → Solution)**: Start with all steps hidden, progressively reveal from beginning to end. Learner builds up the solution step-by-step. Best for initial learning of procedural knowledge.

- **Backward Fading (Solution → Problem)**: Start with only the last step hidden, progressively hide more steps going backward. Learner fills in gaps working backward from the solution. Research shows this produces faster initial learning by reducing cognitive load - learners see most of the solution and only need to fill in one step at a time.

### Active Recall
The review system forces retrieval from memory before revealing answers, strengthening memory consolidation through the testing effect.

### Spaced Repetition (Manual)
The "Save for Later" feature enables learners to defer less-mastered content for future review sessions, supporting distributed practice over time.

### Immediate Feedback
Wrong answers immediately cycle cards back into the review queue, providing corrective feedback while the retrieval attempt is fresh in memory.

### Desirable Difficulties
Sequential unveiling of covered regions creates productive challenge - enough difficulty to engage deep processing without overwhelming working memory.

### Cognitive Load Management
- Image occlusion isolates specific information elements
- Step-by-step progression prevents information overload
- Grouping feature (hold G) allows chunking related information

## Implementation Details

**Queue-Based Review**: Failed cards move to the back of the queue (not randomized), ensuring systematic coverage without the frustration of premature re-testing.

**Dual Queue System**: Main review for active practice, separate "later" queue for deferred items, preventing cognitive overload from attempting too many difficult items in one session.

**Keyboard Shortcuts**: Reduces extraneous cognitive load by enabling rapid, motor-memory-based interactions (Space = next, B = wrong, G = group, Cmd+Z = undo).
