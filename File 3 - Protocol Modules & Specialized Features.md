# Protocol Modules & Specialized Features
## NSDR & Cold Exposure Implementation Guide for Wellness OS

**Synthesis Date:** October 23, 2025
**Source Reports:** #12-#13 (NSDR Module, Cold Exposure Module)
**Status:** Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [NSDR (Non-Sleep Deep Rest) Module](#nsdr-non-sleep-deep-rest-module)
3. [Cold Exposure Module](#cold-exposure-module)
4. [Integration with Core Systems](#integration-with-core-systems)

---

## Executive Summary

This document synthesizes the design and implementation specifications for two **advanced protocol modules** that extend beyond basic sleep and light protocols:

1. **NSDR (Non-Sleep Deep Rest) Module:** Guided relaxation protocols (Yoga Nidra, body scan meditation, hypnosis) designed to accelerate recovery, reduce stress, and improve focus. Target use cases: post-workout recovery, mid-day reset, sleep onset acceleration.

2. **Cold Exposure Module:** Progressive cold therapy protocols (cold showers, ice baths, cold plunges) for metabolic activation, mood enhancement, and resilience building. Target use cases: morning alertness boost, post-workout recovery, weekly challenge.

**Key Design Principles:**
- **Evidence-First:** Both modules cite peer-reviewed research (Huberman Lab protocols, systematic reviews)
- **Progressive Intensity:** Start with beginner-friendly durations (5-10 min NSDR, 30-second cold shower) and scale based on user adherence
- **Safety Guardrails:** Medical contraindication screening (e.g., Raynaud's disease for cold exposure), opt-out mechanisms, HRV-based adaptive intensity
- **Audio-Guided Delivery:** NSDR requires audio scripts; cold exposure uses timer + checkpoint notifications

**Success Metrics (MVP Month 2-3):**
- **NSDR Adoption:** ≥15% of Core tier users try NSDR at least once in first 30 days
- **NSDR Completion:** ≥60% of users who start NSDR finish full session (no early exit)
- **Cold Exposure Adoption:** ≥10% of users try cold exposure protocol in first 60 days
- **Cold Exposure Progression:** ≥30% of cold exposure users increase duration by ≥30 seconds after 2 weeks

---

## NSDR (Non-Sleep Deep Rest) Module

### Overview

NSDR is a **guided relaxation technique** that induces a state similar to stage 1 sleep while maintaining conscious awareness. Benefits (evidence-backed):
- **Stress Reduction:** 20-min NSDR reduces cortisol by 20-30% (equivalent to 1 hour nap)
- **Cognitive Recovery:** Improves focus and working memory after mentally demanding tasks
- **Sleep Acceleration:** Shortens sleep onset latency by 10-15 min when done pre-bedtime

**Protocols Included:**
1. **Yoga Nidra** (10-30 min): Systematic body scan with breath awareness
2. **Body Scan Meditation** (5-20 min): Progressive muscle relaxation
3. **Hypnosis for Sleep** (10-20 min): Guided imagery for sleep onset

### Audio Script Design

**Yoga Nidra Script (10-Minute Version):**

```
[Soft background music: 432 Hz binaural beats or nature sounds]

INTRODUCTION (0:00 - 1:00)
---
"Welcome to this 10-minute NSDR practice. Find a comfortable position lying down or seated. Close your eyes. Take three deep breaths... in through your nose... out through your mouth. With each exhale, let your body relax more deeply."

BODY SCAN (1:00 - 7:00)
---
"Bring your awareness to your right foot. Notice any sensations—warmth, coolness, tingling. Without judgment, simply observe. Now the right ankle... right calf... right knee... right thigh. Let each part soften as you move your attention.

Now shift to your left foot. Left ankle... left calf... left knee... left thigh. Feel the weight of your legs sinking into the surface beneath you.

Bring awareness to your hips... your lower back... your abdomen. Notice your belly rising and falling with each breath. No need to change your breath—just observe.

Now your chest... your upper back... your shoulders. Let your shoulders drop away from your ears. Feel the tension releasing.

Your right arm... right hand... each finger. Now your left arm... left hand. Let your arms rest heavily.

Your neck... your jaw. Let your jaw go slack. Your face... your forehead. Soften the space between your eyebrows. Your scalp... the crown of your head."

BREATH AWARENESS (7:00 - 9:00)
---
"Now bring your attention to your breath. Notice the cool air entering your nostrils... the warm air leaving. The pause between breaths. The gentle rhythm—inhale... exhale... inhale... exhale. If your mind wanders, gently guide it back to your breath. No judgment, just awareness."

INTEGRATION (9:00 - 10:00)
---
"In a moment, you'll return to wakefulness feeling refreshed and alert. Begin to deepen your breath. Wiggle your fingers and toes. When you're ready, open your eyes. Take a moment before standing. Notice how you feel—lighter, calmer, more present.

Thank you for this practice. You can return to your day with renewed focus."

[Music fades]
```

### Implementation Architecture

**Audio Delivery System:**

```typescript
// NSDR Module Architecture
interface NSRDSession {
  id: string;
  protocol_id: string; // 'protocol_yoga_nidra_10min', 'protocol_body_scan_5min'
  duration_minutes: number;
  audio_url: string; // S3 or Firebase Storage URL
  script_text?: string; // Optional transcript for accessibility
  background_music_url?: string;
  user_id: string;
  start_time: Date;
  end_time?: Date;
  completion_status: 'started' | 'completed' | 'abandoned';
  user_feedback?: 'helpful' | 'not_helpful';
}

// Audio Player Component (React Native)
import { Audio } from 'expo-av';

export const NSRDPlayer = ({ session }: { session: NSRDSession }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0-1 (percentage)

  useEffect(() => {
    loadAudio();
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, []);

  const loadAudio = async () => {
    const { sound } = await Audio.Sound.createAsync(
      { uri: session.audio_url },
      { shouldPlay: false },
      onPlaybackStatusUpdate
    );
    setSound(sound);
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setProgress(status.positionMillis / status.durationMillis);

      if (status.didJustFinish) {
        handleCompletion();
      }
    }
  };

  const handlePlay = async () => {
    if (sound) {
      await sound.playAsync();
      setIsPlaying(true);

      // Log start event
      await logNSDREvent({
        user_id: session.user_id,
        protocol_id: session.protocol_id,
        event_type: 'started',
        timestamp: new Date()
      });
    }
  };

  const handlePause = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const handleCompletion = async () => {
    setIsPlaying(false);

    // Log completion event
    await logNSDREvent({
      user_id: session.user_id,
      protocol_id: session.protocol_id,
      event_type: 'completed',
      timestamp: new Date(),
      duration_actual_minutes: session.duration_minutes
    });

    // Show completion feedback prompt
    showFeedbackPrompt();
  };

  return (
    <View style={styles.player}>
      <Text style={styles.title}>{session.protocol_id.replace('protocol_', '').replace(/_/g, ' ')}</Text>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <Text style={styles.timer}>
        {formatTime(progress * session.duration_minutes * 60)} / {formatTime(session.duration_minutes * 60)}
      </Text>

      {/* Controls */}
      <View style={styles.controls}>
        {!isPlaying ? (
          <TouchableOpacity onPress={handlePlay} style={styles.playButton}>
            <Text style={styles.playIcon}>▶</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handlePause} style={styles.pauseButton}>
            <Text style={styles.pauseIcon}>||</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Accessibility: Text Transcript */}
      <TouchableOpacity onPress={() => showTranscript(session.script_text)}>
        <Text style={styles.transcriptLink}>View Transcript</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  player: {
    padding: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 12
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16
  },
  progressBar: {
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF'
  },
  timer: {
    fontSize: 14,
    color: '#AAA',
    marginBottom: 20
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  pauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center'
  },
  playIcon: {
    fontSize: 24,
    color: '#FFF'
  },
  pauseIcon: {
    fontSize: 24,
    color: '#FFF'
  },
  transcriptLink: {
    marginTop: 16,
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center'
  }
};
```

### NSDR Protocol Database Schema

```sql
-- NSDR protocols table
CREATE TABLE nsdr_protocols (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  duration_minutes INT NOT NULL,
  audio_url TEXT NOT NULL,
  script_text TEXT,
  background_music_url TEXT,
  category TEXT NOT NULL, -- 'yoga_nidra', 'body_scan', 'hypnosis'
  difficulty TEXT DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
  tier_required TEXT DEFAULT 'core',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NSDR session logs
CREATE TABLE nsdr_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  protocol_id TEXT NOT NULL REFERENCES nsdr_protocols(id),
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  completion_status TEXT NOT NULL, -- 'started', 'completed', 'abandoned'
  duration_actual_minutes INT,
  user_feedback TEXT, -- 'helpful', 'not_helpful'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE nsdr_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own NSDR sessions"
  ON nsdr_sessions
  FOR ALL
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_nsdr_sessions_user ON nsdr_sessions(user_id, start_time DESC);
```

### NSDR Recommendations (AI Coach Integration)

**When to Recommend NSDR:**

```typescript
// Adaptive Coach rule: Recommend NSDR if HRV below baseline
async function shouldRecommendNSDR(userId: string) {
  const wearableData = await getWearableData(userId, days: 7);
  const baseline = await getUserHRVBaseline(userId);

  // Rule: If HRV < baseline - 10%, recommend recovery protocol
  if (wearableData.avg_hrv < baseline - (baseline * 0.10)) {
    return {
      protocol_id: 'protocol_nsdr_10min',
      nudge_text: 'Your HRV is low today. A 10-min NSDR session can help you recover.',
      reasoning: `HRV: ${wearableData.avg_hrv} (baseline: ${baseline}). NSDR reduces stress and improves HRV.`,
      evidence_citation: 'DOI: Huberman Lab Toolkit',
      timing: 'afternoon',
      confidence_score: 0.75
    };
  }

  // Rule: If user reports poor sleep, recommend NSDR pre-bedtime
  const recentSleep = await getRecentSleepQuality(userId);
  if (recentSleep.avg_sleep_hours < 6.5) {
    return {
      protocol_id: 'protocol_hypnosis_sleep_20min',
      nudge_text: 'Trouble sleeping? Try this 20-min hypnosis session before bed.',
      reasoning: `Sleep: ${recentSleep.avg_sleep_hours} hrs (below optimal). Hypnosis reduces sleep onset latency.`,
      evidence_citation: 'DOI: 10.1093/sleep/zsaa137',
      timing: 'evening',
      confidence_score: 0.80
    };
  }

  return null; // No NSDR recommendation
}
```

---

## Cold Exposure Module

### Overview

Cold exposure (cold showers, ice baths, cold plunges) triggers physiological responses that:
- **Boost Metabolism:** Activates brown adipose tissue (BAT), increases calorie burning by 200-300 calories per session
- **Enhance Mood:** Increases dopamine by 250% (sustained for 3-4 hours post-exposure)
- **Build Resilience:** Repeated cold exposure trains stress response (hormetic stressor)
- **Improve Recovery:** Reduces inflammation (useful post-workout)

**Protocols Included:**
1. **Cold Shower Protocol** (30 sec - 3 min, 2-3x/week): Beginner-friendly, accessible
2. **Ice Bath Protocol** (2-5 min, 1-2x/week): Intermediate/advanced, requires equipment
3. **Cold Plunge Protocol** (1-3 min, 1-2x/week): Advanced, specialized facilities

### Progressive Protocol Design

**Beginner → Intermediate → Advanced Progression:**

```
WEEK 1-2 (Beginner: Build Tolerance)
---
Protocol: Cold Shower (end of warm shower)
Duration: 30 seconds
Temperature: 15-18°C (60-65°F)
Frequency: 2x/week
Breathing: Normal breathing; focus on staying calm

Success Criteria: Complete 30-sec cold shower 4 times (2 weeks)

WEEK 3-4 (Intermediate: Increase Duration)
---
Protocol: Cold Shower (full session)
Duration: 1-2 minutes
Temperature: 12-15°C (55-60°F)
Frequency: 3x/week
Breathing: Box breathing (4-4-4-4) to manage stress response

Success Criteria: Complete 1-min cold shower 6 times (2 weeks)

WEEK 5-8 (Advanced: Ice Bath Introduction)
---
Protocol: Ice Bath
Duration: 2-3 minutes
Temperature: 10-12°C (50-55°F)
Frequency: 2x/week
Breathing: Deep, slow breaths; avoid hyperventilation

Success Criteria: Complete 2-min ice bath 4 times (4 weeks)

WEEK 9+ (Mastery: Extended Exposure)
---
Protocol: Cold Plunge or Ice Bath
Duration: 3-5 minutes
Temperature: 8-10°C (45-50°F)
Frequency: 2-3x/week
Breathing: Controlled breathing; mental focus on relaxation

Success Criteria: Maintain consistent 3-min sessions for 4 weeks
```

### Safety Screening & Contraindications

**Pre-Cold Exposure Health Screening:**

```typescript
// Screen user for contraindications before first cold exposure
export const ColdExposureScreening = () => {
  const [answers, setAnswers] = useState({});

  const questions = [
    {
      id: 'raynauds',
      question: 'Do you have Raynaud's disease or poor circulation in your extremities?',
      type: 'yes_no'
    },
    {
      id: 'heart_condition',
      question: 'Do you have any heart conditions (arrhythmia, coronary artery disease, etc.)?',
      type: 'yes_no'
    },
    {
      id: 'high_blood_pressure',
      question: 'Do you have uncontrolled high blood pressure?',
      type: 'yes_no'
    },
    {
      id: 'pregnant',
      question: 'Are you pregnant or breastfeeding?',
      type: 'yes_no'
    },
    {
      id: 'cold_urticaria',
      question: 'Do you experience hives or allergic reactions to cold (cold urticaria)?',
      type: 'yes_no'
    }
  ];

  const handleSubmit = async () => {
    const hasContraindications = Object.values(answers).some(a => a === 'yes');

    if (hasContraindications) {
      // Block cold exposure protocols
      await showWarningModal({
        title: 'Cold Exposure Not Recommended',
        message: 'Based on your health profile, cold exposure may not be safe. Please consult your doctor before proceeding.',
        actions: [
          { label: 'Understood', action: () => navigation.goBack() }
        ]
      });

      // Log contraindication
      await logEvent({
        event_type: 'cold_exposure_contraindication',
        user_id: userId,
        metadata: answers
      });
    } else {
      // Enable cold exposure protocols
      await enableColdExposure(userId);
      navigation.navigate('ColdExposureOnboarding');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Safety Screening</Text>
      <Text style={styles.subtitle}>
        Cold exposure is safe for most people, but certain health conditions may require medical clearance.
      </Text>

      {questions.map((q, index) => (
        <View key={q.id} style={styles.questionBox}>
          <Text style={styles.questionText}>{index + 1}. {q.question}</Text>
          <View style={styles.answerButtons}>
            <TouchableOpacity
              style={[styles.button, answers[q.id] === 'yes' && styles.buttonSelected]}
              onPress={() => setAnswers({ ...answers, [q.id]: 'yes' })}
            >
              <Text>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, answers[q.id] === 'no' && styles.buttonSelected]}
              onPress={() => setAnswers({ ...answers, [q.id]: 'no' })}
            >
              <Text>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Button title="Submit" onPress={handleSubmit} disabled={Object.keys(answers).length < questions.length} />
    </ScrollView>
  );
};
```

### Cold Exposure Timer & Checkpoint System

**Implementation (React Native):**

```typescript
// ColdExposureTimer.tsx
export const ColdExposureTimer = ({ protocol }: { protocol: ColdExposureProtocol }) => {
  const [timeRemaining, setTimeRemaining] = useState(protocol.target_duration_seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [checkpointsReached, setCheckpointsReached] = useState<number[]>([]);

  const checkpoints = [15, 30, 60, 90, 120, 180]; // Seconds

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;

          // Check if checkpoint reached
          if (checkpoints.includes(protocol.target_duration_seconds - newTime) &&
              !checkpointsReached.includes(protocol.target_duration_seconds - newTime)) {
            handleCheckpoint(protocol.target_duration_seconds - newTime);
          }

          return newTime;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining]);

  const handleStart = () => {
    setIsRunning(true);
    logEvent({ event_type: 'cold_exposure_started', protocol_id: protocol.id });
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = async () => {
    setIsRunning(false);
    const durationCompleted = protocol.target_duration_seconds - timeRemaining;

    // Log completion
    await logColdExposureSession({
      user_id: userId,
      protocol_id: protocol.id,
      duration_actual_seconds: durationCompleted,
      completion_status: durationCompleted >= protocol.target_duration_seconds ? 'completed' : 'partial',
      checkpoints_reached: checkpointsReached
    });

    // Show completion feedback
    showFeedbackModal({
      title: durationCompleted >= protocol.target_duration_seconds ? 'Excellent!' : 'Great Effort!',
      message: durationCompleted >= protocol.target_duration_seconds
        ? `You completed ${formatTime(durationCompleted)} of cold exposure. Your resilience is growing!`
        : `You completed ${formatTime(durationCompleted)}. Every second counts—keep building your tolerance!`,
      actions: [
        { label: 'Done', action: () => navigation.goBack() }
      ]
    });
  };

  const handleCheckpoint = (checkpoint: number) => {
    setCheckpointsReached(prev => [...prev, checkpoint]);

    // Haptic feedback + sound
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Show checkpoint notification
    Toast.show(`${checkpoint} seconds! Keep going 💪`, {
      duration: 2000,
      position: Toast.positions.TOP
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.protocolName}>{protocol.name}</Text>

      {/* Large Timer Display */}
      <View style={styles.timerCircle}>
        <Text style={styles.timerText}>
          {formatTime(timeRemaining)}
        </Text>
        <Text style={styles.timerLabel}>
          {isRunning ? 'remaining' : 'target'}
        </Text>
      </View>

      {/* Checkpoints Indicator */}
      <View style={styles.checkpoints}>
        {checkpoints.filter(cp => cp <= protocol.target_duration_seconds).map(cp => (
          <View
            key={cp}
            style={[
              styles.checkpointDot,
              checkpointsReached.includes(cp) && styles.checkpointReached
            ]}
          />
        ))}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {!isRunning ? (
          <TouchableOpacity onPress={handleStart} style={styles.startButton}>
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity onPress={handlePause} style={styles.pauseButton}>
              <Text style={styles.buttonText}>Pause</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleStop} style={styles.stopButton}>
              <Text style={styles.buttonText}>Stop</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Breathing Guidance */}
      <View style={styles.breathingGuide}>
        <Text style={styles.guideTitle}>Breathing Tip:</Text>
        <Text style={styles.guideText}>
          Breathe slowly and deeply. Inhale through your nose for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat.
        </Text>
      </View>
    </View>
  );
};
```

### HRV-Based Adaptive Intensity

**Rule: Adjust cold exposure duration based on recovery state (HRV):**

```typescript
// Adaptive cold exposure recommendation
async function recommendColdExposureDuration(userId: string) {
  const wearableData = await getWearableData(userId, days: 7);
  const baseline = await getUserHRVBaseline(userId);
  const userProgress = await getColdExposureProgress(userId);

  // Rule 1: If HRV low (< baseline - 15%) → skip cold exposure today
  if (wearableData.avg_hrv < baseline - (baseline * 0.15)) {
    return {
      recommended_action: 'skip',
      message: 'Your HRV is low today. Skip cold exposure and focus on recovery (NSDR, extra sleep).'
    };
  }

  // Rule 2: If HRV normal → standard protocol
  else if (wearableData.avg_hrv >= baseline - (baseline * 0.15) &&
           wearableData.avg_hrv < baseline + (baseline * 0.10)) {
    return {
      recommended_action: 'proceed',
      duration_seconds: userProgress.current_duration_seconds,
      message: `Your HRV is normal. Proceed with your usual ${userProgress.current_duration_seconds / 60}-min cold exposure.`
    };
  }

  // Rule 3: If HRV high (> baseline + 10%) → increase challenge
  else {
    const newDuration = Math.min(
      userProgress.current_duration_seconds + 30, // Add 30 sec
      300 // Cap at 5 min
    );

    return {
      recommended_action: 'increase',
      duration_seconds: newDuration,
      message: `Your HRV is elevated! Try increasing your cold exposure to ${newDuration / 60} min today.`
    };
  }
}
```

---

## Integration with Core Systems

### Event Schema

```typescript
// NSDR Events
enum NSRDEventType {
  NSDR_SESSION_STARTED = 'nsdr.session_started',
  NSDR_SESSION_COMPLETED = 'nsdr.session_completed',
  NSDR_SESSION_ABANDONED = 'nsdr.session_abandoned',
  NSDR_FEEDBACK_RECEIVED = 'nsdr.feedback_received'
}

// Cold Exposure Events
enum ColdExposureEventType {
  COLD_EXPOSURE_STARTED = 'cold_exposure.started',
  COLD_EXPOSURE_COMPLETED = 'cold_exposure.completed',
  COLD_EXPOSURE_PARTIAL = 'cold_exposure.partial',
  COLD_EXPOSURE_CHECKPOINT_REACHED = 'cold_exposure.checkpoint_reached',
  COLD_EXPOSURE_PROGRESSION = 'cold_exposure.progression' // User increased duration
}
```

### Analytics Dashboards

**NSDR Metrics:**
- Adoption rate: % of users who start ≥1 NSDR session in first 30 days
- Completion rate: % of sessions finished (not abandoned)
- Avg session duration: Minutes per session
- Feedback: % marked "helpful" vs. "not helpful"
- Correlation: NSDR usage vs. sleep quality improvement

**Cold Exposure Metrics:**
- Adoption rate: % of users who try cold exposure in first 60 days
- Progression rate: % of users who increase duration ≥30 sec after 2 weeks
- Adherence: Avg sessions per week
- Contraindication blocks: % of users blocked due to health screening
- Correlation: Cold exposure usage vs. HRV improvement

---

**Document Version:** 1.0
**Last Updated:** October 23, 2025
**Maintained By:** Product & Engineering Teams
**Review Cadence:** Quarterly
