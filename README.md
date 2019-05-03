# watson-discovery-sdu-with-assistant

* Use Assistant dialog for better chatbot experience
* Use "customer-care" skill provided by Assistant
* Use Cloud Function to search Disco if question is "anything-else" and reply with disco passages

> Assumes completion of discovery setup described in https://github.com/rhagarty/watson-discovery-sdu-ui.

# TODO:

* Remove code references to calling Disco directly
* Add action creds to .env
* Format Disco results better in chatbot
* Modify search type in Search Skills call to use passages - NOT SUPPORTED

# Notes

* Webhook - beta
* Search Skill - PLUS or PREMIUM PLAN REQUIRED (CURRENTLY BETA)

# Background

There are multiple ways to have Watson Assistant query our Watson Discovery collection:

* Directly invoking a Watson Cloud Functions action
* Using a `webhook` to invoke a Watson Cloud Functions action
* Defining a `Search Skill` to associate with a Watson Discovery collection

All 3 mechanisms are similar in that they are called from a specific Watson Assistant dialog node. The dialog node is then activated during the course of the conversation **IF** the user responds in specific way.

To start, we need to create our dialog which will allow the user to request information from our owner's manual.

To keep this example as easy as possible, we will use the provided `Custom Care Sample Skill` dialog skill that you get for free with the Watson Assistant service. It provides a good basic dialog for interacting with a customer.

But we will need to modify it to handle the case where the user asks an owner's manual type question.

# Create Assistant dialog skill

Click on the `Custom Care Sample Skill` that comes with the Assistant service. You can choose to either duplicate it, or use the original to complete the following steps.

## Add new intent

Create a new intent that can detect when the user is asking an owner's manual question. Name the intent `#Product_Information`.

![](doc/source/images/create-assistant-intent.png)

## Create new dialog node

Select the node labeled `Small Talk` and select the option to `Add node below`:

![](doc/source/images/assistant-insert-node.png)

Label our new Node as `Ask about Product`, and assign our new intent to it.

![](doc/source/images/assistant-create-node.png)

Now, if the during the course of the conversation the user asks a question such as "how do I set the time?", Assistant will recognize this as a request for product information and will activate this node. The result of this should be a request to our Discovery collection. How this is accomplished depends on which of the 3 integration methods you choose.

**Choose one of the following integration methods for further instructions:**

1. [Direct call to Cloud Functions action](#direct-call-to-cloud-functions-action)
1. [Webhook call to Cloud Functions action](#webhook-call-to-cloud-functions-action)
1. [Search Skill](#search-skill)

# Direct call to Cloud Functions action

## Create a Cloud Functions action

Go to [How to create a Cloud Functions action](#how-to-create-a-cloud-functions-action) for instructions on how to create your action.

## Modify dialog node to call Cloud Functions action

In the response section of our newly created dialog node, click on `Open JSON Editor`, and enter the following code snippet:

![](doc/source/images/assistant-input-action-code.png)

The code snippet is:

```javascript
{
  "output": {
    "generic": [
      {
        "values": [
          {
            "text": "Here is some info I found in the manual:"
          }
        ],
        "response_type": "text",
        "selection_policy": "sequential"
      }
    ]
  },
  "actions": [
    {
      "name": "/IBM Cloud Storage_dev/actions/disco-action",
      "type": "server",
      "parameters": {
        "input": "<?input.text?>"
      },
      "credentials": "$my_creds",
      "result_variable": "context.discovery_output"
    }
  ]
}
```

* Note the action `name` value of `/IBM Cloud Storage_dev/actions/disco-action`. This is derived from your endpoint name listed in the `Cloud Functions` action panel:

```https://us-south.functions.cloud.ibm.com/api/v1/namespaces/IBM%20Cloud%20Storage_dev/actions/disco-action```

Remove the host path, and translate encoded chars to ASCII (i.e. `%20` to a blank char).

* Using the `Try it` feature, add the context variable `my_creds` and see if it works (probably won't return anything meaningful in the test window, but you should NOT get an error due to credentials).

> Note: You must enter a response to trigger the assistant dialog node that calls the action.

![](doc/source/images/assistant-context-vars.png)

The format of the credentials should be the following:

```json
{"user":"7a4d1a77-2429-xxxx-xxxx-a2b438e15bea","password":"RVVEdpPFLAuuTwFXjjKujPKY0hUOEztxxxxxxxxxonHeF7OdAm77Uc34GL2wQHDx"}
```

These values are pulled from the `Functions` action panel, click on `API-KEY` which then takes you to the `API Key` panel, where the key is found:

```bash
7a4d1a77-2429-xxxx-xxxx-a2b438e15bea:RVVEdpPFLAuuTwFXjjKujPKY0hUOEztxxxxxxxxxonHeF7OdAm77Uc34GL2wQHDx
```

> Note: the value before the `:` is the user, and everthing after is the password. Do not include the `:` in either value.

## Notes about action type

When you define the programmatic call, you choose one of the following types:

* **server:**

* **client:** Defines a programmatic call in a standardized format that your external client application can understand. Your client application must use the provided information to run the programmatic call or function, and return the result to the dialog. This type of call basically tells the dialog to pause here and wait for the client application to go do something. The program that the client application runs can be anything that you choose. Be sure to specify the call name and parameter details, and the error message variable name, according to the JSON formatting rules that are outlined later.

* **cloud_function:** Calls an Cloud Functions action directly, and returns the result to the dialog. You must provide a Cloud Functions authentication key with the call. (This type used to be named server. The type server continues to be supported.)

* **web_action:** Calls a Cloud Functions web action. Web actions are annotated Cloud Functions actions that developers can use to program backend logic that a web application can access anonymously, without requiring a Cloud Functions authentication key. Although authentication isn't required, web actions can be secured in the following ways:

  * With an authentication token that is specific to the web action, and can be revoked or changed by the action owner at any time
  * By passing your Cloud Functions credentials

## Add Cloud Function creds to application

* The Cloud Function credentials need to be assigned to the Assistant context variable name `my_creds`, and passed in from your application to the Watson Assisant API.

```javascript
    context.my_creds = {
      'user':'7a4d1a77-2429-xxxx-xxxx-a2b438e15bea',
      'password':'RVVEdpPFLAuuTwFXjjKujPKY0hUOEztxxxxxxxxxF7OdAm77Uc34GL2wQHDx'
    };
```

# Webhook call to Cloud Functions action

## Create a Cloud Functions action

Go to [How to create a Cloud Functions action](#how-to-create-a-cloud-functions-action) for instructions on how to create your action.

## Enable webhook from Assistant

* Set up access to WebHook for the our Custom Care skill:

![](doc/source/images/assistant-define-webhook.png)

* In the cell you want to trigger action, click on `Customize`, and enable Webhooks for this node:

![](doc/source/images/assistant-enable-webhook-for-node.png)

* Add the `input` key parameter as shown below - this will pass the user input query to the Discovery service. As a default, the results will be returned in `$webhook_result_1`.

![](doc/source/images/assistant-node-config-webhook.png)

## Test in Assistant Tooling

* Using the `Try it` feature, add the context variable `my_creds` and see if it works. Should not see an error, and if you click on `Manage Context`, you see a new variable added named `$webhook_result_1`.

> Note: You must enter a response to trigger the assistant dialog node that calls the action.

NEW SCREENSHOT WITHOUT webhook varaible.

![](doc/source/images/assistant-webhook-context-vars.png)

{"user":"7a4d1a77-2429-xxxx-xxxx-a2b438e15bea","password":"RVVEdpPFLAuuTwFXjjKujPKY0hUOEztxxxxxxxxxonHeF7OdAm77Uc34GL2wQHDx"}

These values are pulled from the `Functions` action panel, click on `API-KEY` which then takes you to the `API Key` panel, where the key is found:

```bash
7a4d1a77-2429-xxxx-xxxx-a2b438e15bea:RVVEdpPFLAuuTwFXjjKujPKY0hUOEztxxxxxxxxxonHeF7OdAm77Uc34GL2wQHDx
```

> Note: the value before the `:` is the user, and after is the password. Do not include the `:` in either value.

## Add Cloud Function creds to application

* The Cloud Function credentials need to be assigned to the Assistant context variable name `my_creds`, and passed in from your application to the Watson Assisant API.

```javascript
    context.my_creds = {
      'user':'7a4d1a77-2429-xxxx-xxxx-a2b438e15bea',
      'password':'RVVEdpPFLAuuTwFXjjKujPKY0hUOEztxxxxxxxxxF7OdAm77Uc34GL2wQHDx'
    };
```

## How results are returned to the application

Results are returned as part of the Assistant context, in the `webhook_result_1` object:

```
context:
   { global: { system: { turn_count: 1 } },
     skills:
      { 'main skill':
         { user_defined:
            { webhook_result_1:
               { activationId: '9e28cd924fe74774a8cd924fe7b774e5',
                 annotations:
                  [ { key: 'path', value: 'IBM Cloud Storage_dev/disco-action' },
                    { key: 'waitTime', value: 544 },
                    { key: 'kind', value: 'nodejs:8' },
                    { key: 'timeout', value: false },
                    { key: 'limits',
                      value: { concurrency: 1, logs: 10, memory: 256, timeout: 60000 } },
                    { key: 'initTime', value: 453 } ],
                 duration: 1435,
                 end: 1556854584238,
                 logs: [],
                 name: 'disco-action',
                 namespace: 'IBM Cloud Storage_dev',
                 publish: false,
                 response:
                  { result:
                     { matching_results: 9,
                       passages:
                        [ { document_id: '3a5efee70d8cc9d70e2b94d22c15e2d1_2',
                            end_offset: 2791,
                            field: 'text',
                            passage_score: 6.752501692678998,
                            passage_text:
                             'Specify what the heat pump runs when the O/B Reversing Valve is engaged: On Cool runs cooling when O/B engages (most cases), or On Heat runs heating when O/B engages. 4. Touch Next. You will be returned to the Equipment configuration menu. Furnaces/Boilers If you have a furnace or boiler installed: 1. Select the heating menu. 2. Configure the heater type',
                            start_offset: 2435 },

```

# Search Skill

## Create Search Skill

Start creation process:

![](doc/source/images/select-search-skill.png)

Name your skill:

![](doc/source/images/create-search-skill.png)

Attach to Discovery instance and collection:

![](doc/source/images/assign-search-skill-to-collection.png)

Configure how the search will respond:

![](doc/source/images/configure-search-skill.png)

## Invoke the Search Skill from dialog node

Modify the "Ask about product" dialog node to call out to the search skill:

![](doc/source/images/assign-search-skill-to-node.png)

How to use the `Query` option: https://cloud.ibm.com/docs/services/assistant?topic=assistant-dialog-overview#dialog-overview-multimedia

## Create Assistant instance to combine dialog and search skills:

In order to use both skills, you need to create an `Assistant` object that integrates them.

![](doc/source/images/create-assistant-to-link-skills.png)

## Test in Assistant Tooling

From the `Assistant` panel, press the `Preview Link` button:

![](doc/source/images/preview-option-button.png)

Then press the `Preview` URL:

![](doc/source/images/preview-link.png)

Then use the chatbot to test accessing the search skill:

![](doc/source/images/preview-example.png)

## How results are returned to the application

Normal results will be returned in the Assistant response object:

```
{ output:
   { generic:
      [ { response_type: 'text',
          text: 'Would you like me to transfer you to a representative?' } ],
     intents:
      [ { intent: 'General_Connect_to_Agent',
          confidence: 0.9979484558105469 } ],
     entities: []
    }
}
```

If the result is from the search skill:

```
{ output:
   { generic:
      [ { response_type: 'search',
          header: 'I searched my knowledge base and found this information which might be useful:',
          results:
           [ { body: 'Do you hear that? That’s the sound of hundreds of thousands of ecobee-ers welcoming you to the hive. Congratulations on the purchase of your customized web portal, visit ecobee.com and click on the Login link. To select a tile, touch or click on it. To close a tile and return back to the main screen, touch or click (top-right corner).',
               title: '["Overview"]',
               url: null },
```

# Configure credentials

```bash
cp env.sample .env
```

Copy the `env.sample` file and rename it `.env` and update the `<***>` tags with the credentials from your Assistant service.

#### `env.sample:`

```bash
# Copy this file to .env and replace the credentials with
# your own before starting the app.

# Watson Discovery
ASSISTANT_WORKSPACE_ID=<add_assistant_workspace_id>
ASSISTANT_IAM_APIKEY=<add_assistant_iam_apikey>

# Run locally on a non-default port (default is 3000)
# PORT=3000
```

Credentials can be found by clicking the Service Credentials tab, then the View Credentials option from the panel of your created Watson service.

An additional `WORKSPACE_ID` value is required to access the Watson Assistant service. To get this value, select the `Manage` tab, then the `Launch tool` button from the panel of your Watson Assistance service. From the service instance panel, select the `Skills` tab to display the skills that exist for your service. For this tutorial, we will be using the `Custom Skill Sample Skill` that comes with the service:

<p align="center">
  <img width="300" src="doc/source/images/sample-skill.png">
</p>

Click the option button (highlighted in the image above) to view all of your skill details and service credentials:

![](doc/source/images/sample-skill-creds.png)

# Run locally

```bash
npm install
npm start
```

Access the UI by pointing your browser at `localhost:3000`.

Sample questions:

* **how do I set a schedule?**
* **how do I set the temperature?**
* **how do I set the time?**

# Sample Output

![](doc/source/images/sample-output.png)

# Additional Instructions

## How to create a Cloud Functions action

* From IBM Cloud resource list, create `New` and select `Functions`.
* Click on `Actions` tab.
* `Create` and then `Create Action`.
* Provide unique `Action Name`, keep default package, and select `Node.js 10` runtime.
* Add code to action - use code in `/actions/disco-action.js`.

![](doc/source/images/action-params.png)

* Note your endpoint:

![](doc/source/images/action-endpoint.png)

* Test the action by executing the `curl` command shown at the bottom of the panel, or from the `Code` panel, click the `Invoke` button. This will open up an `Activation` window where the action will be executed and the results displayed. Note that the values you have set in the `Parameters` panel will be passed into the action.

![](doc/source/images/action-test.png)
