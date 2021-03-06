/**
 * Copyright 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
  var cfenv = require('cfenv');

  var services = cfenv.getAppEnv().services,
    service;

  var username, password;

  var service = cfenv.getAppEnv().getServiceCreds(/tradeoff analytics/i)

  if (service) {
    username = service.username;
    password = service.password;
  }

  RED.httpAdmin.get('/watson-tradeoff-analytics/vcap', function(req, res) {
    res.json(service);
  });

  function Node(config) {
    RED.nodes.createNode(this,config);
    var node = this;

      this.on('input', function(msg) {
        if (!msg.payload) {
          node.error('Missing property: msg.payload');
          return;
        }

        username = username || config.username;
        password = password || config.password;

        if (!username || !password) {
          node.error('Missing Tradeoff Analytics service credentials');
          return;
        }

        var watson = require('watson-developer-cloud');

        var tradeoff_analytics = watson.tradeoff_analytics({
          username: username,
          password: password,
          version: 'v1'
        });

        tradeoff_analytics.dilemmas({
          subject: msg.payload, 
          columns: msg.columns, 
          options: msg.options 
        }, function (err, response) {
          if (err)
            node.error(err);
          else 
            msg.resolution = response.resolution;

          console.log(JSON.stringify(msg.resolution))
          node.send(msg);
        });
      });
  }
  RED.nodes.registerType("watson-tradeoff-analytics",Node);
};
