import { createAzure } from '@ai-sdk/azure'

/**
 * Azure OpenAI provider configuration for AI SDK
 * Uses the official @ai-sdk/azure provider for proper Azure endpoint handling
 */

if (!process.env.AZURE_OPENAI_RESOURCE_NAME) {
  throw new Error('AZURE_OPENAI_RESOURCE_NAME environment variable is required')
}

if (!process.env.AZURE_OPENAI_API_KEY) {
  throw new Error('AZURE_OPENAI_API_KEY environment variable is required')
}

/**
 * Azure OpenAI provider instance
 * Properly handles Azure-specific URL structure and API versioning
 * Uses deployment names instead of model names
 */
export const azureOpenAI = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: 'preview',
})

/**
 * GPT-4o Mini model for quiz generation and semantic tagging
 * This uses the deployment name from Azure OpenAI Service
 */
export const gptMini = azureOpenAI('gpt-4o-mini')

/**
 * Helper function to get a custom deployment
 * @param deploymentName The name of your Azure OpenAI deployment
 */
export function getAzureModel(deploymentName: string) {
  return azureOpenAI(deploymentName)
}
