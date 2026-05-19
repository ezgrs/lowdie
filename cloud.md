# Cloud

This project is integrated with AWS and this tutorial explains from scratch how to deploy this project into a AWS Lambda.

<!-- TOC start (generated with https://github.com/derlin/bitdowntoc) -->

<!-- TOC start (generated with https://github.com/derlin/bitdowntoc) -->

- [Cloud](#cloud)
    * [Setting up](#setting-up)
        + [IAM](#iam)
        + [IAM Identity Center](#iam-identity-center)
        + [CLI ](#cli)
    * [Deploying](#deploying)
        + [DynamoDB](#dynamodb)
        + [AWS Lambda](#aws-lambda)
        + [API Gateway](#api-gateway)
        + [Telegram](#telegram)

<!-- TOC end -->

<!-- TOC end -->


## Setting up

AWS works by regions. There are many regions, such as `us-east-1`, `eu-west-2` or `sa-east-1`. 

The region of this project will be refered as `PROJECT_REGION` afterwards.

Login to the [AWS Management Console](https://aws.amazon.com/console), creating an account if you haven't one.


### IAM

On the authorization model declared on the Overview section of this document, it's possible to model six policies
that can be used in this project:

- Four human policies described by the "Human permissions" item (`Lowdie-AdminPolicy`, `Lowdie-ManagerPolicy`, `Lowdie-DeployerPolicy`, `Lowdie-ViewerPolicy`)
- One service policy described by the "Resources permissions" item (`Lowdie-LambdaExecutorPolicy`)
- One tool policy described by the "Tools permissions" item (`Lowdie-CICDDeployerPolicy`)

To create a policy:

1. Search for "IAM" on the search bar and click its respective item
2. Go to the _Access Management > Policies_ section on the left sidebar
3. Filter by type "Customer managed"
4. On the top right corner, click **Create policy**
5. On step 1, select the "JSON" view on the "Policy editor" card and declare its contents, clicking **Next** afterwards
6. On step 2, give the policy a name and click **Create policy**

The minimal JSON permissions needed for this project for each policy declared above is:

- For the `Lowdie-LambdaExecutorPolicy` policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "CloudWatchLogs",
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "*"
        },
        {
            "Sid": "DynamoDBSessionTableAccess",
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem"
            ],
            "Resource": "arn:aws:dynamodb:*:*:table/Lowdie-Session"
        }
    ]
}
```

> There should be an entry for API Gateway too, since the Lambda depends on it to give invoke permission.
> However, AWS calls this a **resource-based policy** and it's declared on another page in the Console.

- For the `Lowdie-DeployerPolicy` policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "LambdaDeploy",
      "Effect": "Allow",
      "Action": "lambda:UpdateFunctionCode",
      "Resource": "arn:aws:lambda:*:*:function:Lowdie-*"
    }
  ]
}
```

- For the `Lowdie-ManagerPolicy` policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "LambdaManagement",
            "Effect": "Allow",
            "Action": [
                "lambda:CreateFunction",
                "lambda:AddPermission"
            ],
            "Resource": "*"
        },
        {
            "Sid": "DynamoDBManagement",
            "Effect": "Allow",
            "Action": "dynamodb:CreateTable",
            "Resource": "*"
        },
        {
            "Sid": "ApiGatewayManagement",
            "Effect": "Allow",
            "Action": "apigateway:POST",
            "Resource": "*"
        },
        {
          "Sid": "PassRoleLambda",
          "Effect": "Allow",
          "Action": "iam:PassRole",
          "Resource": "arn:aws:iam::*:role/Lowdie-LambdaExecutorRole"
        }
    ]
}
```

> For the sake of simplicity, `Lowdie-AdminPolicy` and `Lowdie-ViewerPolicy` will not be declared,
> since the former is too broad and the latter is too narrow. In a production system, however, they
> are recommended.

A **role** applies one or more policies. Roles are not created manually for human policies,
since the IAM Identity Center creates them automatically.

To create the Lambda executor role:

1. Search for "IAM" on the search bar and click its respective item
2. Go to the _Access Management > Roles_ section on the left sidebar
3. On the top right corner, click **Create role**
4. On step 1, select "AWS service" as the trusted entity type, "Lambda" as service or use case and "Lambda" as use case; click **Next**
5. On step 2, filter by type "Customer managed", select the `Lowdie-LambdaExecutorPolicy` and click **Next**
6. On step 3, enter `Lowdie-LambdaExecutorRole` as the role name and click **Create role**


### IAM Identity Center

1. Search for "IAM Identity Center" on the search bar and click its respective item.
2. Click **Enable** on the right side bar. An "Enable IAM Identity Center with AWS Organizations" page will show up, click **Enable** again.
3. On the right sidebar, in the "Settings summary" card, set the field "Instance name".
4. Create a new IAM user:

    - Go to the _Users_ section on the left side bar
    - On the top right corner, click **Add user**
    - On step 1, fill all fields of the "Primary information" form
      - The "Username" field was set as "firstname.lastname"
      - The "Password" field was set as "Send an email to this user with password setup instructions"
    - On step 2, click **Next**
    - On step 3, click **Add user**
    - An e-mail will be sent to the account set on the form; create a password for the account and enable MFA

5. Create the permission set for the deployer profile:

    - Go to the _Multi-account permissions > Permission sets_ section on the left sidebar
    - On the top right corner, click **Create permission set**
    - On step 1, select "Custom permission set" as the permission set type and click **Next**
    - On step 2, expand the "Customer manager policies" card and click **Attach policies**,
      entering the policies you need this permission set to have access (in this case,
      `Lowdie-DeployerPolicy`); click **Next**
    - On step 3, enter `Lowdie-DeployerPermissionSet` as its name and click **Next**
    - On step 4, click **Create**
  
6. Create the permission set for the manager profile executing the same steps as the
   described before, but attaching the policies `Lowdie-DeployerPolicy` and `Lowdie-ManagerPolicy`

7. Link the created IAM user to a AWS account:

    - Go to the _Multi-account permissions > AWS accounts_ section on the left sidebar
    - Mark the checkbox on your root AWS account
    - On the top right corner, click **Assign users or groups**
    - On step 1, on the _Users_ section, mark the checkbox on your created IAM user and click **Next**
    - On step 2, mark all the permission sets this user must have access and click **Next** 
    - On step 3, click **Submit**


### CLI 

1. Download and install the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).

```shell
aws --version
```
```lang-none
aws-cli/2.34.48 Python/3.14.4 Windows/10 exe/AMD64
```

2. Configure your AWS CLI to use Single Sign-On (SSO) as the manager:

```shell
aws configure sso --profile manager
```

- For `SSO session name (Recommended):`, give it a name like "dev" or your first name
- For `SSO start URL [None]:`, paste the "IPv4-only" field accessible on the IAM Identity Center's right sidebar, on the "AWS access portal URLs" card (e.g. `https://d-XXXXXXXXXX.awsapps.com/start`)
- For `SSO region [None]:`, type the `PROJECT_REGION`
- For `SSO registration scopes [sso:account:access]:`, type Enter to accept the default

After that, your browser will open and you must sign in with your IAM user (not your AWS account).

A message will show up:

```lang-none
The only AWS account available to you is: 999999999999
Using the account ID 999999999999
There are 2 roles available to you.
```

This 12-digit account ID will be refered as `AWS_ACCOUNT_ID`.

On the dropdown list, select the `Lowdie-ManagerPermissionSet`.

- For `Default client Region [None]:`, type the `PROJECT_REGION` again
- For `CLI default output format (json if not specified) [None]:`, type Enter to accept the default

3. Create the deployer profile by following the same steps as above, but this time passing `--profile deployer` and
selecting `Lowdie-DeployerPermissionSet` on the dropdown list.


## Deploying

### DynamoDB

1. Create the session table for this project:

```shell
aws dynamodb create-table 
    --table-name lowdie-Session
    --attribute-definitions AttributeName=TelegramChatId,AttributeType=N
    --key-schema AttributeName=TelegramChatId,KeyType=HASH
    --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1
    --profile manager
```

> Note that an `AccessDeniedException` will be shown if you pass `--profile deployer`.

This table's ARN will be `arn:aws:dynamodb:PROJECT_REGION:AWS_ACCOUNT_ID:table/lowdie-Session`.


### AWS Lambda

1. Compile this code:

```shell
npx tsc
```

2. Zip the output including the _node\_modules/_ folder and the _package.json_ file
(Windows syntax, using WinRar to compress):

```batch
xcopy node_modules dist\node_modules /E /I /H /Y
copy package.json dist
mkdir out
"C:\Program Files\WinRAR\WinRar.exe" a -afzip -r -ep1 out\dist.zip "dist\*"
```

3. Upload it (where `BOT_TOKEN` is your Telegram bot's token):

```shell
aws lambda create-function
    --function-name Lowdie-TelegramWebhook
    --runtime nodejs22.x
    --role arn:aws:iam::AWS_ACCOUNT_ID:role/Lowdie-LambdaExecutorRole
    --handler interfaces/telegram/aws/index.handler
    --zip-file fileb://out/dist.zip
    --timeout 10
    --memory-size 128
    --environment "Variables={TELEGRAM_BOT_TOKEN=BOT_TOKEN}"
    --region PROJECT_REGION
    --profile manager
```

This function's ARN will be `arn:aws:lambda:PROJECT_REGION:AWS_ACCOUNT_ID:function:Lowdie-TelegramWebhook`


### API Gateway

1. Create a new HTTP API:

```shell
aws apigatewayv2 create-api
    --name Lowdie-TelegramWebhookAPI
    --protocol-type HTTP
    --profile manager
```

A JSON will be returned containing two values: `ApiEndpoint` (the public URL of the webhook)
and `ApiId` (a 10-character string that will be refered as `API_ID`).

2. Link the created API with the Lambda function (the
   `--integration-type` argument should be set as is):

```shell
aws apigatewayv2 create-integration
    --api-id API_ID
    --integration-type AWS_PROXY
    --integration-uri arn:aws:lambda:PROJECT_REGION:AWS_ACCOUNT_ID:function:Lowdie-TelegramWebhook
    --payload-format-version 2.0
    --profile manager
```

A JSON will be returned containing a 7-character `IntegrationId` value,
which will be refered as `INTEGRATION_ID`.

3. Add the webhook endpoint to the API:

```
aws apigatewayv2 create-route
    --api-id API_ID
    --route-key "POST /webhook"
    --target "integrations/INTEGRATION_ID"
    --profile manager
```

4. Deploy it to the `prod` environment:

```shell
aws apigatewayv2 create-stage
    --api-id API_ID
    --stage-name prod
    --auto-deploy
    --profile manager
```

5. Allow the Lambda to be called by the API Gateway:

```shell
aws lambda add-permission
    --function-name Lowdie-TelegramWebhook
    --statement-id apigateway-access
    --action lambda:InvokeFunction
    --principal apigateway.amazonaws.com
    --source-arn arn:aws:execute-api:PROJECT_REGION:AWS_ACCOUNT_ID:API_ID/*/POST/webhook
    --profile manager
```

### Telegram

1. Point Telegram to the deployed webhook (where `BOT_TOKEN` is your Telegram bot's token):

```shell
curl 
    -X POST "https://api.telegram.org/botBOT_TOKEN/setWebhook"
    -H "Content-Type: application/json"
    -d "{\"url\":\"https://API_ID.execute-api.PROJECT_REGION.amazonaws.com/prod/webhook\"}"
```
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

