#!/bin/bash
set -e

# Azure Infrastructure Provisioning Script
# Knowledge Quiz Agent - Phase 1 Migration

echo "Starting Azure infrastructure provisioning..."

# Configuration
RESOURCE_GROUP="rg-knowledge-quiz-prod"
LOCATION="eastus"  # Choose region with Azure OpenAI availability
APP_NAME="knowledge-quiz"

# Database Configuration
DB_ADMIN_USER="dbadmin"
DB_ADMIN_PASSWORD="KnowledgeQuiz123!"  # Change this to a secure password
DB_NAME="knowledgequiz"

echo "Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  App Name: $APP_NAME"
echo ""

# 1. Create Resource Group
echo "1. Creating resource group..."
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION \
  --output table

# 2. Create Log Analytics Workspace (required for Container Apps)
echo "2. Creating Log Analytics Workspace..."
az monitor log-analytics workspace create \
  --resource-group $RESOURCE_GROUP \
  --workspace-name "log-$APP_NAME-prod" \
  --location $LOCATION \
  --output table

# Get workspace ID and key
echo "   Retrieving workspace credentials..."
LOG_ANALYTICS_WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group $RESOURCE_GROUP \
  --workspace-name "log-$APP_NAME-prod" \
  --query customerId -o tsv)

LOG_ANALYTICS_KEY=$(az monitor log-analytics workspace get-shared-keys \
  --resource-group $RESOURCE_GROUP \
  --workspace-name "log-$APP_NAME-prod" \
  --query primarySharedKey -o tsv)

echo "   Workspace ID: $LOG_ANALYTICS_WORKSPACE_ID"

# 3. Create Application Insights
echo "3. Creating Application Insights..."
az monitor app-insights component create \
  --app "appi-$APP_NAME-prod" \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --workspace "log-$APP_NAME-prod" \
  --output table

# 4. Create Azure Container Registry
echo "4. Creating Azure Container Registry..."
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name "acrknowledgequizprod" \
  --sku Basic \
  --admin-enabled true \
  --output table

# 5. Create Key Vault
echo "5. Creating Key Vault..."
az keyvault create \
  --name "kv-knowledgequiz-prod" \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --enable-rbac-authorization false \
  --output table

# 6. Create Azure OpenAI Service
echo "6. Creating Azure OpenAI Service..."
az cognitiveservices account create \
  --name "oai-$APP_NAME-prod" \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --kind OpenAI \
  --sku S0 \
  --custom-domain "oai-$APP_NAME-prod" \
  --output table

# Deploy gpt-4o-mini model
echo "   Deploying gpt-4o-mini model..."
az cognitiveservices account deployment create \
  --name "oai-$APP_NAME-prod" \
  --resource-group $RESOURCE_GROUP \
  --deployment-name "gpt-4o-mini" \
  --model-name "gpt-4o-mini" \
  --model-version "2024-07-18" \
  --model-format OpenAI \
  --sku-capacity 10 \
  --sku-name "Standard" \
  --output table

# 7. Create PostgreSQL Flexible Server
echo "7. Creating PostgreSQL Flexible Server..."
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name "psql-$APP_NAME-prod" \
  --location $LOCATION \
  --admin-user $DB_ADMIN_USER \
  --admin-password "$DB_ADMIN_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 14 \
  --public-access 0.0.0.0-255.255.255.255 \
  --high-availability Disabled \
  --output table

# Enable required extensions
echo "   Enabling PostgreSQL extensions..."
az postgres flexible-server parameter set \
  --resource-group $RESOURCE_GROUP \
  --server-name "psql-$APP_NAME-prod" \
  --name azure.extensions \
  --value "uuid-ossp,pg_trgm"

# Create database
echo "   Creating database..."
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name "psql-$APP_NAME-prod" \
  --database-name $DB_NAME \
  --output table

# 8. Create Container Apps Environment
echo "8. Creating Container Apps Environment..."
az containerapp env create \
  --name "cae-$APP_NAME-prod" \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --logs-workspace-id $LOG_ANALYTICS_WORKSPACE_ID \
  --logs-workspace-key $LOG_ANALYTICS_KEY \
  --output table

# 9. Get credentials and store in Key Vault
echo "9. Storing secrets in Key Vault..."

# Database connection string
DATABASE_URL="postgresql://$DB_ADMIN_USER:$DB_ADMIN_PASSWORD@psql-$APP_NAME-prod.postgres.database.azure.com:5432/$DB_NAME?sslmode=require"
az keyvault secret set \
  --vault-name "kv-knowledgequiz-prod" \
  --name "DATABASE-URL" \
  --value "$DATABASE_URL" \
  --output table

# Azure OpenAI endpoint
AZURE_OPENAI_ENDPOINT="https://oai-$APP_NAME-prod.openai.azure.com"
az keyvault secret set \
  --vault-name "kv-knowledgequiz-prod" \
  --name "AZURE-OPENAI-ENDPOINT" \
  --value "$AZURE_OPENAI_ENDPOINT" \
  --output table

# Azure OpenAI key
AZURE_OPENAI_KEY=$(az cognitiveservices account keys list \
  --name "oai-$APP_NAME-prod" \
  --resource-group $RESOURCE_GROUP \
  --query key1 -o tsv)
az keyvault secret set \
  --vault-name "kv-knowledgequiz-prod" \
  --name "AZURE-OPENAI-KEY" \
  --value "$AZURE_OPENAI_KEY" \
  --output table

# Application Insights connection string
APPINSIGHTS_CONN_STRING=$(az monitor app-insights component show \
  --app "appi-$APP_NAME-prod" \
  --resource-group $RESOURCE_GROUP \
  --query connectionString -o tsv)
az keyvault secret set \
  --vault-name "kv-knowledgequiz-prod" \
  --name "APPLICATIONINSIGHTS-CONNECTION-STRING" \
  --value "$APPINSIGHTS_CONN_STRING" \
  --output table

echo ""
echo "=========================================="
echo "Infrastructure provisioning completed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Run your database setup script:"
echo "   psql \"$DATABASE_URL\" -f scripts/setup.sql"
echo ""
echo "2. Update your .env.local for local development:"
echo "   DATABASE_URL=\"$DATABASE_URL\""
echo "   AZURE_OPENAI_ENDPOINT=\"$AZURE_OPENAI_ENDPOINT\""
echo "   AZURE_OPENAI_KEY=\"$AZURE_OPENAI_KEY\""
echo "   APPLICATIONINSIGHTS_CONNECTION_STRING=\"$APPINSIGHTS_CONN_STRING\""
echo ""
echo "3. Container Registry credentials:"
ACR_USERNAME=$(az acr credential show -n acrknowledgequizprod --query username -o tsv)
ACR_PASSWORD=$(az acr credential show -n acrknowledgequizprod --query passwords[0].value -o tsv)
echo "   Username: $ACR_USERNAME"
echo "   Password: $ACR_PASSWORD"
echo ""
echo "4. Container App will be created during first deployment"
echo ""
