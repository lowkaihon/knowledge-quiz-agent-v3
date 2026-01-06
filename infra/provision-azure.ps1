# Azure Infrastructure Provisioning Script (PowerShell)
# Knowledge Quiz Agent - Phase 1 Migration

Write-Host "Starting Azure infrastructure provisioning..." -ForegroundColor Green

# Configuration
$RESOURCE_GROUP = "rg-knowledge-quiz-prod"
$LOCATION = "eastus2"  # Choose region with Azure OpenAI availability
$APP_NAME = "knowledge-quiz"

# Database Configuration
$DB_ADMIN_USER = "dbadmin"
$DB_ADMIN_PASSWORD = "KnowledgeQuiz123!"  # CHANGE THIS to a secure password!
$DB_NAME = "knowledgequiz"

Write-Host "`nConfiguration:" -ForegroundColor Cyan
Write-Host "  Resource Group: $RESOURCE_GROUP"
Write-Host "  Location: $LOCATION"
Write-Host "  App Name: $APP_NAME"
Write-Host ""

# 1. Create Resource Group
Write-Host "1. Creating resource group..." -ForegroundColor Yellow
az group create --name $RESOURCE_GROUP --location $LOCATION --output table

# 2. Create Log Analytics Workspace (required for Container Apps)
Write-Host "`n2. Creating Log Analytics Workspace..." -ForegroundColor Yellow
az monitor log-analytics workspace create --resource-group $RESOURCE_GROUP --workspace-name "log-${APP_NAME}-prod" --location $LOCATION --output table

# Get workspace ID and key
Write-Host "   Retrieving workspace credentials..." -ForegroundColor Gray
$LOG_ANALYTICS_WORKSPACE_ID = az monitor log-analytics workspace show --resource-group $RESOURCE_GROUP --workspace-name "log-${APP_NAME}-prod" --query customerId -o tsv

$LOG_ANALYTICS_KEY = az monitor log-analytics workspace get-shared-keys --resource-group $RESOURCE_GROUP --workspace-name "log-${APP_NAME}-prod" --query primarySharedKey -o tsv

Write-Host "   Workspace ID: $LOG_ANALYTICS_WORKSPACE_ID" -ForegroundColor Gray

# 3. Create Application Insights
Write-Host "`n3. Creating Application Insights..." -ForegroundColor Yellow
az monitor app-insights component create --app "appi-${APP_NAME}-prod" --location $LOCATION --resource-group $RESOURCE_GROUP --workspace "log-${APP_NAME}-prod" --output table

# 4. Create Azure Container Registry
Write-Host "`n4. Creating Azure Container Registry..." -ForegroundColor Yellow
az acr create --resource-group $RESOURCE_GROUP --name "acrknowledgequizprod" --sku Basic --admin-enabled true --output table

# 5. Create Key Vault
Write-Host "`n5. Creating Key Vault..." -ForegroundColor Yellow
az keyvault create --name "kv-knowledgequiz-prod" --resource-group $RESOURCE_GROUP --location $LOCATION --enable-rbac-authorization false --output table

# 6. Create Azure OpenAI Service
Write-Host "`n6. Creating Azure OpenAI Service..." -ForegroundColor Yellow
az cognitiveservices account create --name "oai-${APP_NAME}-prod" --resource-group $RESOURCE_GROUP --location $LOCATION --kind OpenAI --sku S0 --custom-domain "oai-${APP_NAME}-prod" --output table

# Deploy gpt-4o-mini model
Write-Host "   Deploying gpt-4o-mini model..." -ForegroundColor Gray
az cognitiveservices account deployment create --name "oai-${APP_NAME}-prod" --resource-group $RESOURCE_GROUP --deployment-name "gpt-4o-mini" --model-name "gpt-4o-mini" --model-version "2024-07-18" --model-format OpenAI --sku-capacity 10 --sku-name "Standard" --output table

# 7. Create PostgreSQL Flexible Server
Write-Host "`n7. Creating PostgreSQL Flexible Server..." -ForegroundColor Yellow
az postgres flexible-server create --resource-group $RESOURCE_GROUP --name "psql-${APP_NAME}-prod" --location $LOCATION --admin-user $DB_ADMIN_USER --admin-password $DB_ADMIN_PASSWORD --sku-name Standard_B1ms --tier Burstable --storage-size 32 --version 14 --public-access 0.0.0.0-255.255.255.255 --high-availability Disabled --output table

# Enable required extensions
Write-Host "   Enabling PostgreSQL extensions..." -ForegroundColor Gray
az postgres flexible-server parameter set --resource-group $RESOURCE_GROUP --server-name "psql-${APP_NAME}-prod" --name azure.extensions --value "uuid-ossp,pg_trgm"

# Create database
Write-Host "   Creating database..." -ForegroundColor Gray
az postgres flexible-server db create --resource-group $RESOURCE_GROUP --server-name "psql-${APP_NAME}-prod" --database-name $DB_NAME --output table

# 8. Create Container Apps Environment
Write-Host "`n8. Creating Container Apps Environment..." -ForegroundColor Yellow
az containerapp env create --name "cae-${APP_NAME}-prod" --resource-group $RESOURCE_GROUP --location $LOCATION --logs-workspace-id $LOG_ANALYTICS_WORKSPACE_ID --logs-workspace-key $LOG_ANALYTICS_KEY --output table

# 9. Get credentials and store in Key Vault
Write-Host "`n9. Storing secrets in Key Vault..." -ForegroundColor Yellow

# Database connection string
$DATABASE_URL = "postgresql://${DB_ADMIN_USER}:${DB_ADMIN_PASSWORD}@psql-${APP_NAME}-prod.postgres.database.azure.com:5432/${DB_NAME}?sslmode=require"
az keyvault secret set --vault-name "kv-knowledgequiz-prod" --name "DATABASE-URL" --value $DATABASE_URL --output table

# Azure OpenAI endpoint
$AZURE_OPENAI_ENDPOINT = "https://oai-${APP_NAME}-prod.openai.azure.com"
az keyvault secret set --vault-name "kv-knowledgequiz-prod" --name "AZURE-OPENAI-ENDPOINT" --value $AZURE_OPENAI_ENDPOINT --output table

# Azure OpenAI key
$AZURE_OPENAI_KEY = az cognitiveservices account keys list --name "oai-${APP_NAME}-prod" --resource-group $RESOURCE_GROUP --query key1 -o tsv
az keyvault secret set --vault-name "kv-knowledgequiz-prod" --name "AZURE-OPENAI-KEY" --value $AZURE_OPENAI_KEY --output table

# Application Insights connection string
$APPINSIGHTS_CONN_STRING = az monitor app-insights component show --app "appi-${APP_NAME}-prod" --resource-group $RESOURCE_GROUP --query connectionString -o tsv
az keyvault secret set --vault-name "kv-knowledgequiz-prod" --name "APPLICATIONINSIGHTS-CONNECTION-STRING" --value $APPINSIGHTS_CONN_STRING --output table

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Infrastructure provisioning completed!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run your database setup script:" -ForegroundColor White
Write-Host "   psql `"$DATABASE_URL`" -f scripts/setup.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Update your .env.local for local development:" -ForegroundColor White
Write-Host "   DATABASE_URL=`"$DATABASE_URL`"" -ForegroundColor Gray
Write-Host "   AZURE_OPENAI_ENDPOINT=`"$AZURE_OPENAI_ENDPOINT`"" -ForegroundColor Gray
Write-Host "   AZURE_OPENAI_KEY=`"$AZURE_OPENAI_KEY`"" -ForegroundColor Gray
Write-Host "   APPLICATIONINSIGHTS_CONNECTION_STRING=`"$APPINSIGHTS_CONN_STRING`"" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Container Registry credentials:" -ForegroundColor White
$ACR_USERNAME = az acr credential show -n acrknowledgequizprod --query username -o tsv
$ACR_PASSWORD = az acr credential show -n acrknowledgequizprod --query passwords[0].value -o tsv
Write-Host "   Username: $ACR_USERNAME" -ForegroundColor Gray
Write-Host "   Password: $ACR_PASSWORD" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Container App will be created during first deployment" -ForegroundColor White
Write-Host ""
