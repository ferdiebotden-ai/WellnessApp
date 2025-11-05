import { describe, expect, it } from 'vitest';
import { formatFeedbackSummary, groupFeedbackSummaries, type FeedbackSummaryEntry } from '../src/analyzeNudgeFeedback';

describe('groupFeedbackSummaries', () => {
  it('aggregates rows by protocol and module with feedback counts', () => {
    const grouped = groupFeedbackSummaries([
      {
        protocol_id: 'protocol_one',
        module_id: 'module_alpha',
        user_feedback: 'thumb_up',
        count: 3,
      },
      {
        protocol_id: 'protocol_one',
        module_id: 'module_alpha',
        user_feedback: 'thumb_down',
        count: 1,
      },
      {
        protocol_id: 'protocol_two',
        module_id: null,
        user_feedback: 'thumb_up',
        count: 2,
      },
    ]);

    expect(grouped).toEqual<FeedbackSummaryEntry[]>([
      {
        protocolId: 'protocol_one',
        moduleId: 'module_alpha',
        total: 4,
        counts: {
          thumb_down: 1,
          thumb_up: 3,
        },
      },
      {
        protocolId: 'protocol_two',
        moduleId: null,
        total: 2,
        counts: {
          thumb_up: 2,
        },
      },
    ]);
  });
});

describe('formatFeedbackSummary', () => {
  it('creates a readable summary with totals and breakdowns', () => {
    const windowStart = new Date('2024-07-01T00:00:00.000Z');
    const windowEnd = new Date('2024-07-08T00:00:00.000Z');

    const output = formatFeedbackSummary(
      [
        {
          protocolId: 'protocol_one',
          moduleId: 'module_alpha',
          total: 4,
          counts: {
            thumb_up: 3,
            thumb_down: 1,
          },
        },
        {
          protocolId: 'protocol_two',
          moduleId: null,
          total: 2,
          counts: {
            thumb_up: 2,
          },
        },
      ],
      windowStart,
      windowEnd,
    );

    expect(output).toBe(
      [
        '[ContinuousLearningEngine] Feedback summary for 2024-07-01T00:00:00.000Z → 2024-07-08T00:00:00.000Z',
        '• protocol=protocol_one | module=module_alpha | total=4 | thumb_down: 1 | thumb_up: 3',
        '• protocol=protocol_two | module=unassigned | total=2 | thumb_up: 2',
      ].join('\n'),
    );
  });

  it('notes when no feedback is available', () => {
    const output = formatFeedbackSummary([], null, new Date('2024-07-08T00:00:00.000Z'));

    expect(output).toBe(
      `[ContinuousLearningEngine] Feedback summary for beginning → 2024-07-08T00:00:00.000Z\n` +
        'No new feedback recorded for this window.',
    );
  });
});
