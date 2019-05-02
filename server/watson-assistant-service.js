/**
 * Copyright 2017 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License'); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

const Promise = require('bluebird');
const AssistantV2 = require('ibm-watson/assistant/v2');

var assistant;
const version = '2019-02-28';
assistant = new AssistantV2({
  version: version
});

assistant.assistantId = process.env.ASSISTANT_ID;
console.log('assistant.assistantId: ' + assistant.assistantId);

assistant.createSession = Promise.promisify(assistant.createSession);
assistant.message = Promise.promisify(assistant.message);

module.exports = assistant;
