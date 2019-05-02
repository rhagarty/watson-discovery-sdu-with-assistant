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

import 'isomorphic-fetch';
import React from 'react';
import PropTypes from 'prop-types';
import Messages from './Messages';
import { Grid, Header, Card, Input } from 'semantic-ui-react';

const utils = require('../lib/utils');
const util = require('util');  

/**
 * Main React object that contains all objects on the web page.
 * This object manages all interaction between child objects as
 * well as making search requests to the discovery service.
 */
class Main extends React.Component {
  constructor(...props) {
    super(...props);
    const { 
      error,
      // assistant data
      context,
      userInput,
      conversation
    } = this.props;

    // change in state fires re-render of components
    this.state = {
      // query data
      loading: false,
      error: error,
      // assistant data
      context: {},
      userInput: '',
      conversation: 
        [{ 
          id: 0,
          text: 'Hello! How can I help you today?',
          owner: 'watson'
        }]
    };
  }
  
  /**
   * fetchData - build the query that will be passed to the 
   * discovery service.
   */
  sendMessage(text) {
    var { context, conversation } = this.state;

    // context.my_creds = {
    //   'user':'7a4d1a77-2429-43b1-b6ed-a2b438e15bea',
    //   'password':'RVVEdpPFLAuuTwFXjjKujPKY0hUOEzt6nQ6O7NwyonHeF7OdAm77Uc34GL2wQHDx'
    // };

    this.setState({
      context: context
    });

    // send request
    fetch('/api/message', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        context: context,
        message: text
      })
    }).then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw response;
      }
    })
      .then(json => {
        console.log('+++ ASSISTANT RESULTS +++');
        const util = require('util');
        console.log(util.inspect(json, false, null));

        // console.log('json.output.text[0]: ' + json.output.text[0]);
        this.printContext(json.context);
        //console.log('OUTPUT: ' + json.output);//.text[0]);

        // add to message list
        var response = json.output.generic[0];
        if (response.response_type === 'text') {
          conversation.push(
            { id: conversation.length,
              text: response.text,
              owner: 'watson'
            });
        } else if (response.response_type == 'search') {
          // display header response and up to 3 search results
          conversation.push({
            id: conversation.length,
            text: response.header,
            owner: 'watson'
          });
          
          var maxResponses = 3;
          var numResponses = 0;
          var idx = 0;
          var done = false;
          while (!done) {
            if (response.results[idx]) {
              conversation.push({
                id: conversation.length,
                text: response.results[idx].body,
                owner: 'watson'
              });
              numResponses = numResponses + 1;
            } else {
              done = true;
            }

            if (numResponses == maxResponses) {
              done = true;
            }
            idx = idx + 1;
          }
        }
        
        this.setState({
          conversation: conversation,
          context: json.context,
          error: null,
          userInput: ''
        });
        scrollToMain();

      })
      .catch(response => {
        this.setState({
          error: 'Error in assistant'
        });
        // eslint-disable-next-line no-console
        console.error(response);
      });
  }

  /* Log Watson Assistant context values, so we can follow along with its logic. */
  printContext(context) {
    console.log('Dialog Stack:');
    console.log(util.inspect(context, false, null));
    // if (context.system) {
      // if (context.system.dialog_stack) {
        // console.log(
        //   '     dialog_stack: [' + util.inspect(context.system.dialog_stack, false, null) + ']');
        // console.log('Dialog Stack:');
        // console.log(util.inspect(context, false, null));
      // }    }
  }
  
  handleOnChange(event) {
    this.setState({userInput: event.target.value});
  }

  handleKeyPress(event) {
    const { userInput, conversation } = this.state;

    if (event.key === 'Enter') {
      conversation.push(
        { id: conversation.length,
          text: userInput,
          owner: 'user'
        }
      );

      this.sendMessage(userInput);

      this.setState({
        conversation: conversation,
        // clear out input field
        userInput: ''
      });

    }
  }

  getListItems() {
    const { conversation } = this.state;

    return (
      <Messages
        messages={conversation}
      />
    );
  }

  /**
   * render - return all the home page object to be rendered.
   */
  render() {
    const { userInput } = this.state;

    return (
      <Grid celled className='search-grid'>

        <Grid.Row className='matches-grid-row'>
          <Grid.Column width={16}>

            <Card className='chatbot-container'>
              <Card.Content className='dialog-header'>
                <Card.Header>Document Search ChatBot</Card.Header>
              </Card.Content>
              <Card.Content>
                {this.getListItems()}
              </Card.Content>
              <Input
                icon='compose'
                iconPosition='left'
                value={userInput}
                placeholder='Enter response......'
                onKeyPress={this.handleKeyPress.bind(this)}
                onChange={this.handleOnChange.bind(this)}
              />
            </Card>

          </Grid.Column>
        </Grid.Row>

      </Grid>
    );
  }
}

/**
 * scrollToMain - scroll window to show 'main' rendered object.
 */
function scrollToMain() {
  setTimeout(() => {
    const scrollY = document.querySelector('main').getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, scrollY);
  }, 0);
}

// type check to ensure we are called correctly
Main.propTypes = {
  context: PropTypes.object,
  userInput: PropTypes.string,
  conversation: PropTypes.array,
  error: PropTypes.object
};

module.exports = Main;
