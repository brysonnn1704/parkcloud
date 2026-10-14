const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || '';

const cloudWatch = new CloudWatchClient({ region: AWS_REGION });
const snsClient = new SNSClient({ region: AWS_REGION });

// Rate-limiting timestamp for lot high-occupancy notifications
const lastNotifiedMap = new Map();

/**
 * Publish Custom Metrics to AWS CloudWatch
 */
async function publishCustomMetrics({ occupancyRate, bookingsCount = 1, failedCount = 0 }) {
  if (!process.env.AWS_EXECUTION_ENV && !process.env.ENABLE_CLOUDWATCH_METRICS) {
    // In local dev without credentials, log locally and skip network call
    return;
  }

  try {
    const params = {
      Namespace: 'ParkCloud/Application',
      MetricData: [
        {
          MetricName: 'LotOccupancyRate',
          Dimensions: [{ Name: 'Environment', Value: process.env.NODE_ENV || 'demo' }],
          Unit: 'Percent',
          Value: occupancyRate,
        },
        {
          MetricName: 'BookingsPerMinute',
          Dimensions: [{ Name: 'Environment', Value: process.env.NODE_ENV || 'demo' }],
          Unit: 'Count',
          Value: bookingsCount,
        },
        {
          MetricName: 'FailedBookings',
          Dimensions: [{ Name: 'Environment', Value: process.env.NODE_ENV || 'demo' }],
          Unit: 'Count',
          Value: failedCount,
        },
      ],
    };

    const command = new PutMetricDataCommand(params);
    await cloudWatch.send(command);
  } catch (err) {
    console.warn('[CloudWatch Metrics Warning] Failed to publish metrics:', err.message);
  }
}

/**
 * Send SNS Alert for Critical Events (e.g., High Occupancy > 90%)
 */
async function sendOccupancyAlertIfNeeded(lotName, occupancyRate) {
  if (occupancyRate < 90 || !SNS_TOPIC_ARN) return;

  const now = Date.now();
  const lastSent = lastNotifiedMap.get(lotName) || 0;
  // Rate-limit: 1 notification every 30 minutes per lot
  if (now - lastSent < 30 * 60 * 1000) return;

  try {
    const message = `[ParkCloud Alert] High Occupancy Alert for ${lotName}!\nCurrent Occupancy Rate: ${occupancyRate}%. Immediate attention recommended.`;
    const command = new PublishCommand({
      TopicArn: SNS_TOPIC_ARN,
      Subject: `ParkCloud Alert: High Occupancy at ${lotName}`,
      Message: message,
    });
    await snsClient.send(command);
    lastNotifiedMap.set(lotName, now);
    console.log(`[SNS] Sent high occupancy alert for ${lotName}`);
  } catch (err) {
    console.warn('[SNS Alert Warning] Failed to publish SNS message:', err.message);
  }
}

module.exports = {
  publishCustomMetrics,
  sendOccupancyAlertIfNeeded,
};
