/*
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2019, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */
const ipc = require('node-ipc');
const uuidv4 = require('uuid/v4');
const {EventEmitter} = require('@osjs/event-emitter');

const SERVER_NAME = 'osjs-pam-auth-server';

class IPC extends EventEmitter {
  constructor(options) {
    super('IPC');

    this.options = options;
    this.queue = [];
  }

  connect() {
    ipc.config.id = 'osjs-pam-auth-client';
    ipc.config.retry = 1500;
    ipc.config.silent = true;

    ipc.connectTo('osjs-pam-auth-server', () => {
      ipc.of[SERVER_NAME].on('connect', () => this.emit('connect'));
      ipc.of[SERVER_NAME].on('disconnect', () => this.emit('disconnect'));
      ipc.of[SERVER_NAME].on('message', data => this.onmessage(JSON.parse(data)));
    });
  }

  login(login) {
    return new Promise((resolve, reject) => {
      const uuid = uuidv4();
      const callback = (error, result) =>
        error ? reject(new Error(error)) : resolve(result);

      this.queue.push({
        uuid,
        callback
      });

      const msg = {uuid, login, options: this.options};

      ipc.of[SERVER_NAME].emit('message', JSON.stringify(msg));
    });
  }

  onmessage({error, uuid, result}) {
    const found = this.queue.find(q => q.uuid === uuid);
    if (found) {
      found.callback(error, result);
    }
  }
}

module.exports = class IPCAdapter {
  constructor(options) {
    this.options = options;
    this.ipc = new IPC(options);
  }

  init() {
    console.log('Connecting to PAM IPC');

    return new Promise((resolve) => {
      this.ipc.once('connect', resolve);
      this.ipc.connect();
    });
  }

  logout() {
    return Promise.resolve(true);
  }

  login(login) {
    return this.ipc.login(login);
  }
};
