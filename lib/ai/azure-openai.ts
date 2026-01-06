import { createOpenAI } from '@ai-sdk/openai'

/**
 * Azure OpenAI provider configuration for AI SDK
 * Replaces direct OpenAI API with Azure OpenAI Service
 */

if (!process.env.AZURE_OPENAI_ENDPOINT) {
  throw new Error('AZURE_OPENAI_ENDPOINT environment variable is required')
}

if (!process.env.AZURE_OPENAI_KEY) {
  throw new Error('AZURE_OPENAI_KEY environment variable is required')
}

/**
 * Azure OpenAI provider instance
 * Uses deployment names instead of model names
 */
export const azureOpenAI = createOpenAI({
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments`,
  apiKey: process.env.AZURE_OPENAI_KEY,
  headers: {
    'api-version': '2024-08-01-preview',
  },
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
