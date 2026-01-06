import * as appInsights from 'applicationinsights'

/**
 * Initialize Application Insights for Azure monitoring
 * Only runs on the server side
 */

if (typeof window === 'undefined' && process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  try {
    appInsights
      .setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true)
      .setUseDiskRetryCaching(true)
      .setSendLiveMetrics(false) // Disable live metrics for cost savings
      .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
      .start()

    console.log('Application Insights initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Application Insights:', error)
  }
}

export const appInsightsClient = typeof window === 'undefined' ? appInsights.defaultClient : null

/**
 * Track a custom event
 */
export function trackEvent(name: string, properties?: { [key: string]: any }) {
  if (appInsightsClient) {
    appInsightsClient.trackEvent({ name, properties })
  }
}

/**
 * Track a custom metric
 */
export function trackMetric(name: string, value: number, properties?: { [key: string]: any }) {
  if (appInsightsClient) {
    appInsightsClient.trackMetric({ name, value, properties })
  }
}

/**
 * Track an exception
 */
export function trackException(exception: Error, properties?: { [key: string]: any }) {
  if (appInsightsClient) {
    appInsightsClient.trackException({ exception, properties })
  }
}

/**
 * Track a dependency (external API call)
 */
export function trackDependency(
  name: string,
  data: string,
  duration: number,
  success: boolean,
  properties?: { [key: string]: any }
) {
  if (appInsightsClient) {
    appInsightsClient.trackDependency({
      name,
      data,
      duration,
      success,
      dependencyTypeName: 'HTTP',
      properties,
    })
  }
}
