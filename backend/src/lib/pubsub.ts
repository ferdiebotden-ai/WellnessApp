import { PubSub } from '@google-cloud/pubsub';

let cachedPubSub: PubSub | null = null;

export const getPubSub = (): PubSub => {
  if (!cachedPubSub) {
    cachedPubSub = new PubSub();
  }

  return cachedPubSub;
};

export const publishOnboardingCompleted = async (
  payload: { user_id: string; primary_module_id: string }
) => {
  const topicName = process.env.ONBOARDING_COMPLETED_TOPIC || 'user.onboarding.completed';
  const pubsub = getPubSub();

  const dataBuffer = Buffer.from(JSON.stringify(payload));
  await pubsub.topic(topicName).publishMessage({ data: dataBuffer });
};
